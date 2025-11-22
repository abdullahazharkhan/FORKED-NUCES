let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        // create one shared promise
        refreshPromise = (async () => {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                // Refresh failed then logged out
                refreshPromise = null;
                throw new Error("Refresh failed");
            }

            refreshPromise = null;
        })();
    }

    // All callers wait on the same promise
    return refreshPromise;
}

export async function authFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    // First attempt
    let res = await fetch(input, {
        ...init,
        credentials: "include", 
    });

    if (res.status !== 401) {
        return res;
    }

    // Access token expired then WAIT for refresh
    try {
        await refreshAccessToken();
    } catch (err) {
        // If refresh fails, user is logged out
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw err;
    }

    // Retry original request after refresh
    return fetch(input, {
        ...init,
        credentials: "include",
    });
}
