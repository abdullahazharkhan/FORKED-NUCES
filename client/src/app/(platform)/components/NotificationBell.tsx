"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import { readAuthResponse } from "@/lib/authFormResponse";
import { notificationQueryKeys } from "@/lib/engagementQueryKeys";

type UnreadCountResponse = { unread_count: number };

export function NotificationBell() {
    const { data } = useQuery({
        queryKey: notificationQueryKeys.unreadCount,
        queryFn: async ({ signal }) => {
            const response = await authFetch("/api/notifications/unread-count", {
                signal,
            });
            const body = await readAuthResponse<UnreadCountResponse>(
                response,
                "Unable to load notification count."
            );
            return body ?? { unread_count: 0 };
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
    });

    const unreadCount = Math.max(0, Number(data?.unread_count ?? 0));
    const label =
        unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications";

    return (
        <Link
            href="/notifications"
            aria-label={label}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white"
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );
}
