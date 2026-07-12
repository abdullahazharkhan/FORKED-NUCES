"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Bell,
    Check,
    CheckCheck,
    Heart,
    MessageCircle,
    ShieldAlert,
    Sparkles,
    UserRoundCheck,
} from "lucide-react";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import { notificationQueryKeys } from "@/lib/engagementQueryKeys";
import { readPaginatedArray } from "@/lib/pagination";
import { getSafeInternalPath } from "@/lib/safeRedirect";

type NotificationItem = {
    notification_id: number;
    event_type:
        | "collaboration_request"
        | "collaboration_decision"
        | "comment"
        | "like"
        | "issue_closed"
        | "moderation";
    message: string;
    url_path: string;
    actor_user_id: number | null;
    actor_full_name: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
};

type UnreadCountResponse = { unread_count: number };

const pageSize = 20;
const notificationSkeletonIds = ["one", "two", "three", "four", "five"] as const;
const notificationFilters = [
    { label: "All", value: false },
    { label: "Unread", value: true },
] as const;

const eventDetails = {
    collaboration_request: { label: "Collaboration request", Icon: UserRoundCheck },
    collaboration_decision: { label: "Collaboration update", Icon: UserRoundCheck },
    comment: { label: "Comment", Icon: MessageCircle },
    like: { label: "Like", Icon: Heart },
    issue_closed: { label: "Issue closed", Icon: CheckCheck },
    moderation: { label: "Report update", Icon: ShieldAlert },
} as const;

function formatNotificationDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return `${date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    })} UTC`;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [unreadOnly, setUnreadOnly] = useState(false);

    const notifications = useInfiniteQuery({
        queryKey: notificationQueryKeys.list(unreadOnly),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(pageSize),
                offset: String(pageParam),
            });
            if (unreadOnly) params.set("unread", "true");
            const response = await authFetch(`/api/notifications?${params}`, {
                signal,
            });
            if (!response.ok) {
                await readAuthResponse(response, "Unable to load notifications.");
            }
            return readPaginatedArray<NotificationItem>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const unreadCountQuery = useQuery({
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
    });

    const refreshNotifications = async () => {
        await queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.all,
        });
    };

    const markRead = useMutation({
        mutationFn: async (notificationId: number) => {
            const response = await authFetch(
                `/api/notifications/${notificationId}/read`,
                { method: "POST" }
            );
            return readAuthResponse(response, "Unable to mark the notification as read.");
        },
        onSuccess: refreshNotifications,
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            const response = await authFetch("/api/notifications/mark-all-read", {
                method: "POST",
            });
            return readAuthResponse(response, "Unable to mark notifications as read.");
        },
        onSuccess: refreshNotifications,
    });

    const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];
    const totalCount = notifications.data?.pages[0]?.totalCount;
    const unreadTotal = Math.max(0, Number(unreadCountQuery.data?.unread_count ?? 0));
    const actionError = markRead.error ?? markAllRead.error;

    return (
        <div className="relative isolate min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[#f4f3f8]" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-32 bottom-16 -z-10 h-80 w-80 rounded-full bg-primarypurple/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-32 top-72 -z-10 h-80 w-80 rounded-full bg-primarygreen/20 blur-3xl" aria-hidden="true" />

            <div className="mx-auto max-w-5xl space-y-6">
            <header className="relative isolate flex flex-col gap-7 overflow-hidden rounded-[2rem] bg-primarypurple px-6 py-8 text-white shadow-[0_24px_70px_rgba(75,40,175,0.22)] sm:px-9 sm:py-10 md:flex-row md:items-end md:justify-between lg:px-12">
                <div className="landing-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primarygreen/20 blur-3xl" aria-hidden="true" />
                <div className="relative max-w-2xl">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                        Your update centre
                    </div>
                    <h1 className="flex items-center gap-3 text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarygreen text-black shadow-lg shadow-black/10">
                            <Bell className="h-6 w-6" aria-hidden="true" />
                        </span>
                        Notifications
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-white/90 sm:text-base" role="status" aria-live="polite">
                        {unreadTotal > 0
                            ? `${unreadTotal} unread update${unreadTotal === 1 ? "" : "s"} waiting for you.`
                            : "You are all caught up. New activity will appear here."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={unreadTotal === 0 || markAllRead.isPending}
                    className="relative inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                    <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    {markAllRead.isPending ? "Marking..." : "Mark all as read"}
                </button>
            </header>

            <div className="flex w-fit gap-1 rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_10px_30px_rgba(35,20,75,0.06)]" role="group" aria-label="Notification filters">
                {notificationFilters.map((filter) => (
                    <button
                        key={filter.label}
                        type="button"
                        aria-pressed={unreadOnly === filter.value}
                        onClick={() => setUnreadOnly(filter.value)}
                        className={`min-h-10 rounded-xl px-4 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple ${unreadOnly === filter.value
                            ? "bg-primarypurple text-white shadow-[0_8px_20px_rgba(111,67,254,0.2)]"
                            : "text-black/55 hover:bg-primarypurple/[0.06] hover:text-primarypurple"
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {actionError && (
                <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
                    {getAuthFormErrorMessage(actionError, "Unable to update notifications.")}
                </p>
            )}

            {notifications.isPending && (
                <div className="space-y-3" role="status" aria-label="Loading notifications">
                    {notificationSkeletonIds.map((id) => (
                        <div
                            key={id}
                            className="h-28 animate-pulse rounded-2xl border border-black/[0.07] bg-white shadow-sm"
                        />
                    ))}
                </div>
            )}

            {notifications.isError && (
                <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center">
                    <span>
                        {getAuthFormErrorMessage(
                            notifications.error,
                            "Unable to load notifications."
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => void notifications.refetch()}
                        disabled={notifications.isFetching}
                        className="min-h-10 rounded-lg px-3 font-bold underline transition hover:bg-red-100 disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!notifications.isPending && !notifications.isError && items.length === 0 && (
                <div className="rounded-[1.75rem] border border-dashed border-primarypurple/25 bg-white p-10 text-center shadow-[0_12px_35px_rgba(35,20,75,0.05)]">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                        <Bell className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-lg font-black tracking-[-0.02em]">
                        {unreadOnly ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Project and collaboration updates will appear here.
                    </p>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-3">
                    <p className="px-1 text-xs font-medium text-black/50" aria-live="polite">
                        Showing {items.length}
                        {typeof totalCount === "number" ? ` of ${totalCount}` : ""}
                    </p>
                    {items.map((notification) => {
                        const detail = eventDetails[notification.event_type];
                        const Icon = detail.Icon;
                        const destination = getSafeInternalPath(
                            notification.url_path,
                            "/notifications"
                        );
                        return (
                            <article
                                key={notification.notification_id}
                                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_8px_26px_rgba(35,20,75,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(35,20,75,0.09)] ${notification.is_read
                                    ? "border-black/[0.07] bg-white hover:border-primarypurple/20"
                                    : "border-primarypurple/25 bg-gradient-to-br from-white via-white to-primarypurple/[0.06]"
                                    }`}
                            >
                                {!notification.is_read && (
                                    <span className="absolute inset-y-0 left-0 w-1 bg-primarygreen" aria-hidden="true" />
                                )}
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? "bg-black/[0.04] text-black/50" : "bg-primarypurple text-white shadow-[0_8px_20px_rgba(111,67,254,0.18)]"}`}>
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-primarypurple">
                                                {detail.label}
                                            </span>
                                            {!notification.is_read && (
                                                <span className="rounded-full bg-primarygreen px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={destination}
                                            onClick={() => {
                                                if (!notification.is_read) {
                                                    markRead.mutate(notification.notification_id);
                                                }
                                            }}
                                            className="block text-sm font-bold leading-6 text-gray-900 transition-colors hover:text-primarypurple focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primarypurple sm:text-base"
                                        >
                                            {notification.message}
                                        </Link>
                                        <time
                                            dateTime={notification.created_at}
                                            className="block text-xs text-gray-500"
                                        >
                                            {formatNotificationDate(notification.created_at)}
                                        </time>
                                    </div>
                                    {!notification.is_read && (
                                        <button
                                            type="button"
                                            aria-label="Mark notification as read"
                                            title="Mark as read"
                                            disabled={
                                                markRead.isPending &&
                                                markRead.variables === notification.notification_id
                                            }
                                            onClick={() => markRead.mutate(notification.notification_id)}
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-primarypurple/10 hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {notifications.hasNextPage && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => void notifications.fetchNextPage()}
                        disabled={notifications.isFetchingNextPage}
                        className="min-h-12 rounded-xl bg-primarypurple px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(111,67,254,0.2)] transition-all hover:-translate-y-0.5 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                        {notifications.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}
