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
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_8px_20px_rgba(21,5,68,0.15)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border-2 border-[#5d2ee8] bg-red-500 px-1 text-center font-mono text-[9px] font-black leading-4 text-white shadow-sm"
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );
}
