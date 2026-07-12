"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { isTerminalAuthError, refreshAccessToken } from "@/lib/authFetch";
import { readRefreshGeneration } from "@/lib/refreshCoordinator";
import { buildLoginPath, getBrowserPathForLogin } from "@/lib/safeRedirect";
import { useAuthStore, type UserType } from "@/stores/auth/useAuthStore";

async function fetchCurrentUser(): Promise<Response> {
    return fetch("/api/auth/me", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
    });
}

const protectedRoutePrefixes = [
    "/activity",
    "/leaderboard",
    "/platform",
    "/profile",
    "/notifications",
    "/collaborations",
];

export function SessionBootstrap() {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const setUser = useAuthStore((state) => state.setUser);
    const clearUser = useAuthStore((state) => state.clearUser);
    const setSessionStatus = useAuthStore((state) => state.setSessionStatus);

    useEffect(() => {
        const isProtectedRoute = protectedRoutePrefixes.some((prefix) =>
            pathname.startsWith(prefix)
        );
        if (!isProtectedRoute) return;

        let active = true;

        async function loadSession() {
            try {
                localStorage.removeItem("auth-user-storage");
            } catch {
                // Legacy identity cleanup is optional; cookies remain authoritative.
            }
            setSessionStatus("loading");

            try {
                const observedGeneration = readRefreshGeneration();
                let response = await fetchCurrentUser();

                if (response.status === 401) {
                    try {
                        await refreshAccessToken(observedGeneration);
                        response = await fetchCurrentUser();
                    } catch (error) {
                        if (!active) return;
                        if (isTerminalAuthError(error)) {
                            queryClient.clear();
                            clearUser();
                            router.replace(buildLoginPath(getBrowserPathForLogin()));
                        } else setSessionStatus("error");
                        return;
                    }
                }

                if (!response.ok) {
                    if (!active) return;
                    if (response.status === 401 || response.status === 403) {
                        queryClient.clear();
                        clearUser();
                        router.replace(buildLoginPath(getBrowserPathForLogin()));
                    } else setSessionStatus("error");
                    return;
                }

                const user = (await response.json()) as UserType;
                if (active) {
                    const existingUserId = useAuthStore.getState().user?.user_id;
                    if (existingUserId && existingUserId !== user.user_id) queryClient.clear();
                    setUser(user);
                }
            } catch {
                if (active) setSessionStatus("error");
            }
        }

        void loadSession();
        return () => {
            active = false;
        };
    }, [clearUser, pathname, queryClient, router, setSessionStatus, setUser]);

    return null;
}
