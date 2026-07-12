import { useAuthStore } from "@/stores/auth/useAuthStore";
import {
    readRefreshGeneration,
    runWithRefreshCoordination,
} from "@/lib/refreshCoordinator";
import { buildLoginPath, getBrowserPathForLogin } from "@/lib/safeRedirect";

let refreshPromise: Promise<void> | null = null;

export class AuthRefreshError extends Error {
    constructor(public readonly status: number) {
        super("Refresh failed");
        this.name = "AuthRefreshError";
    }
}

export function isTerminalAuthError(error: unknown): boolean {
    return error instanceof AuthRefreshError && (error.status === 401 || error.status === 403);
}

export async function refreshAccessToken(observedGeneration?: string | null): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = runWithRefreshCoordination(async () => {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new AuthRefreshError(res.status);
            }
        }, { observedGeneration }).then(() => undefined).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function authFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const observedGeneration = readRefreshGeneration();
    const res = await fetch(input, {
        ...init,
        credentials: "include", 
    });

    if (res.status !== 401) {
        return res;
    }

    try {
        await refreshAccessToken(observedGeneration);
    } catch (err) {
        if (isTerminalAuthError(err)) {
            useAuthStore.getState().clearUser();
            if (typeof window !== "undefined") {
                window.location.href = buildLoginPath(getBrowserPathForLogin());
            }
        }
        throw err;
    }

    const retry = await fetch(input, {
        ...init,
        credentials: "include",
    });

    if (retry.status === 401) {
        useAuthStore.getState().clearUser();
        if (typeof window !== "undefined") {
            window.location.href = buildLoginPath(getBrowserPathForLogin());
        }
    }

    return retry;
}
