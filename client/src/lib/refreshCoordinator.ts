export const REFRESH_GENERATION_KEY = "forked-auth-refresh-generation";

const REFRESH_LEASE_KEY = "forked-auth-refresh-lease";
const REFRESH_LOCK_NAME = "forked-auth-token-refresh";
const LEASE_DURATION_MS = 12_000;
const WAIT_INTERVAL_MS = 50;

type LockManagerLike = {
    request<T>(
        name: string,
        options: { mode: "exclusive" },
        callback: () => Promise<T>
    ): Promise<T>;
};

type RefreshCoordinationOptions = {
    storage?: Storage | null;
    locks?: LockManagerLike;
    now?: () => number;
    createId?: () => string;
    wait?: (milliseconds: number) => Promise<void>;
    observedGeneration?: string | null;
};

type Lease = { owner: string; expiresAt: number };

function getBrowserStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function getBrowserLocks(): LockManagerLike | undefined {
    if (typeof navigator === "undefined" || !navigator.locks) return undefined;
    return navigator.locks as unknown as LockManagerLike;
}

function safeGet(storage: Storage | null, key: string): string | null {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

function safeSet(storage: Storage, key: string, value: string): boolean {
    try {
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function safeRemove(storage: Storage, key: string): void {
    try {
        storage.removeItem(key);
    } catch {
        // Coordination storage is best-effort; authentication still uses HttpOnly cookies.
    }
}

function readLease(storage: Storage): Lease | null {
    const raw = safeGet(storage, REFRESH_LEASE_KEY);
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as Partial<Lease>;
        return typeof value.owner === "string" && typeof value.expiresAt === "number"
            ? { owner: value.owner, expiresAt: value.expiresAt }
            : null;
    } catch {
        return null;
    }
}

export function hasRefreshGenerationAdvanced(
    observed: string | null,
    current: string | null
): boolean {
    return current !== null && current !== observed;
}

export function readRefreshGeneration(): string | null {
    return safeGet(getBrowserStorage(), REFRESH_GENERATION_KEY);
}

export async function runWithRefreshCoordination(
    refresh: () => Promise<void>,
    options: RefreshCoordinationOptions = {}
): Promise<boolean> {
    const storage = options.storage === undefined ? getBrowserStorage() : options.storage;
    const locks = options.locks ?? getBrowserLocks();
    const now = options.now ?? Date.now;
    const createId = options.createId ?? (() => crypto.randomUUID());
    const wait = options.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    const observedGeneration = options.observedGeneration === undefined
        ? safeGet(storage ?? null, REFRESH_GENERATION_KEY)
        : options.observedGeneration;

    const refreshIfStillNeeded = async () => {
        const currentGeneration = safeGet(storage ?? null, REFRESH_GENERATION_KEY);
        if (hasRefreshGenerationAdvanced(observedGeneration, currentGeneration)) return false;

        await refresh();
        if (storage) safeSet(storage, REFRESH_GENERATION_KEY, createId());
        return true;
    };

    if (locks) {
        return locks.request(
            REFRESH_LOCK_NAME,
            { mode: "exclusive" },
            refreshIfStillNeeded
        );
    }

    if (!storage) {
        await refresh();
        return true;
    }

    const owner = createId();
    const deadline = now() + LEASE_DURATION_MS;

    while (now() < deadline) {
        if (
            hasRefreshGenerationAdvanced(
                observedGeneration,
                safeGet(storage, REFRESH_GENERATION_KEY)
            )
        ) {
            return false;
        }

        const lease = readLease(storage);
        if (!lease || lease.expiresAt <= now()) {
            const acquired = safeSet(
                storage,
                REFRESH_LEASE_KEY,
                JSON.stringify({ owner, expiresAt: now() + LEASE_DURATION_MS })
            );
            if (!acquired) {
                await refresh();
                return true;
            }

            if (readLease(storage)?.owner === owner) {
                try {
                    return await refreshIfStillNeeded();
                } finally {
                    if (readLease(storage)?.owner === owner) {
                        safeRemove(storage, REFRESH_LEASE_KEY);
                    }
                }
            }
        }

        await wait(WAIT_INTERVAL_MS);
    }

    throw new Error("Timed out waiting for another tab to refresh the session.");
}
