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
import { PlatformPageHeader } from "../components/PlatformPageHeader";

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
        <div className="px-5 py-8 sm:px-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-8">
            <PlatformPageHeader
                eyebrow="Your update centre"
                title={<>Notification <span className="text-primarygreen">inbox.</span></>}
                description={
                    <span role="status" aria-live="polite">
                        {unreadTotal > 0
                            ? `${unreadTotal} unread update${unreadTotal === 1 ? "" : "s"} waiting for you.`
                            : "You are all caught up. New activity will appear here."}
                    </span>
                }
                actions={
                <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={unreadTotal === 0 || markAllRead.isPending}
                    className="relative inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    {markAllRead.isPending ? "Marking..." : "Mark all as read"}
                </button>
                }
            />

            <div className="flex w-fit border-b border-black/15" role="group" aria-label="Notification filters">
                {notificationFilters.map((filter) => (
                    <button
                        key={filter.label}
                        type="button"
                        aria-pressed={unreadOnly === filter.value}
                        onClick={() => setUnreadOnly(filter.value)}
                        className={`relative min-h-11 px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:bg-primarypurple/10 ${unreadOnly === filter.value
                            ? "text-primarypurple after:absolute after:inset-x-0 after:-bottom-px after:h-1 after:bg-primarygreen"
                            : "text-black/60 hover:text-primarypurple"
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
                            className="h-28 animate-pulse border-b border-black/10 bg-white/75"
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
                <div className="border-y border-dashed border-primarypurple/35 bg-white/70 p-10 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-primarypurple/10 text-primarypurple">
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
                <div>
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
                                className={`group relative overflow-hidden border-b p-5 transition-colors duration-200 active:bg-primarypurple/[0.035] ${notification.is_read
                                    ? "border-black/10 bg-white/70 hover:bg-white"
                                    : "border-primarypurple/25 bg-white hover:bg-primarypurple/[0.025]"
                                    }`}
                            >
                                {!notification.is_read && (
                                    <span className="absolute inset-y-0 left-0 w-1 bg-primarygreen" aria-hidden="true" />
                                )}
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${notification.is_read ? "bg-black/[0.04] text-black/55" : "bg-primarypurple text-white"}`}>
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-primarypurple">
                                                {detail.label}
                                            </span>
                                            {!notification.is_read && (
                                                <span className="bg-primarygreen px-2 py-1 text-[10px] font-black uppercase tracking-wider text-black">
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
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-primarypurple/10 hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px disabled:opacity-50"
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
                        className="min-h-12 rounded-md bg-primarypurple px-6 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px disabled:opacity-60"
                    >
                        {notifications.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}
