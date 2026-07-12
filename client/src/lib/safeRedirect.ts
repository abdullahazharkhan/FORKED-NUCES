const FALLBACK_PATH = "/platform";
const VALIDATION_ORIGIN = "https://forked.local";

export function getSafeInternalPath(
    value: string | null | undefined,
    fallback = FALLBACK_PATH
): string {
    const candidate = value?.trim();
    if (
        !candidate ||
        !candidate.startsWith("/") ||
        candidate.startsWith("//") ||
        candidate.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(candidate)
    ) {
        return fallback;
    }

    try {
        const url = new URL(candidate, VALIDATION_ORIGIN);
        if (url.origin !== VALIDATION_ORIGIN) return fallback;
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return fallback;
    }
}

export function buildLoginPath(nextPath: string | null | undefined): string {
    const safePath = getSafeInternalPath(nextPath);
    return `/login?next=${encodeURIComponent(safePath)}`;
}

export function getBrowserPathForLogin(): string {
    if (typeof window === "undefined") return FALLBACK_PATH;
    return getSafeInternalPath(
        `${window.location.pathname}${window.location.search}`
    );
}

