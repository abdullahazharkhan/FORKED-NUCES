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
        <div className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
                        <Bell className="h-8 w-8 text-primarypurple" aria-hidden="true" />
                        Notifications
                    </h1>
                    <p className="mt-1 text-sm text-gray-600" role="status" aria-live="polite">
                        {unreadTotal > 0
                            ? `${unreadTotal} unread update${unreadTotal === 1 ? "" : "s"}`
                            : "You are all caught up."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={unreadTotal === 0 || markAllRead.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-primarypurple/30 px-4 py-2 text-sm font-semibold text-primarypurple transition hover:bg-primarypurple/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    {markAllRead.isPending ? "Marking..." : "Mark all as read"}
                </button>
            </header>

            <div className="flex gap-2" role="group" aria-label="Notification filters">
                {notificationFilters.map((filter) => (
                    <button
                        key={filter.label}
                        type="button"
                        aria-pressed={unreadOnly === filter.value}
                        onClick={() => setUnreadOnly(filter.value)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${unreadOnly === filter.value
                            ? "bg-primarypurple text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:border-primarypurple/60"
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {actionError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {getAuthFormErrorMessage(actionError, "Unable to update notifications.")}
                </p>
            )}

            {notifications.isPending && (
                <div className="space-y-3" role="status" aria-label="Loading notifications">
                    {notificationSkeletonIds.map((id) => (
                        <div
                            key={id}
                            className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
                        />
                    ))}
                </div>
            )}

            {notifications.isError && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
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
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!notifications.isPending && !notifications.isError && items.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <Bell className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
                    <p className="mt-3 font-semibold">
                        {unreadOnly ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Project and collaboration updates will appear here.
                    </p>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500" aria-live="polite">
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
                                className={`rounded-xl border p-4 ${notification.is_read
                                    ? "border-gray-200 bg-white"
                                    : "border-primarypurple/30 bg-primarypurple/5"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-primarypurple/10 p-2 text-primarypurple">
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-primarypurple">
                                                {detail.label}
                                            </span>
                                            {!notification.is_read && (
                                                <span className="rounded-full bg-primarypurple px-2 py-0.5 text-[10px] font-bold text-white">
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
                                            className="block font-medium text-gray-900 hover:text-primarypurple hover:underline"
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
                                            className="rounded-full p-2 text-gray-500 transition hover:bg-primarypurple/10 hover:text-primarypurple disabled:opacity-50"
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
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void notifications.fetchNextPage()}
                        disabled={notifications.isFetchingNextPage}
                        className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {notifications.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
}
