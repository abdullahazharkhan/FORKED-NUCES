"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Activity as ActivityIcon,
    CalendarDays,
    FolderGit2,
    Heart,
    MessageCircle,
    Tags,
    UserRoundCheck,
    type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { RetryAlert } from "../components/RetryAlert";
import { UserAvatar } from "../components/UserAvatar";
import {
    parseRecentActivities,
    parseUserActivityStats,
    projectActivityPath,
    userProfilePath,
} from "@/lib/activityData";
import { authFetch } from "@/lib/authFetch";
import { readAuthResponse } from "@/lib/authFormResponse";
import { queryKeys } from "@/lib/queryKeys";

const activityLimits = [20, 50, 100] as const;
const statsSkeletonIds = ["score", "projects", "issues", "comments"] as const;
const activitySkeletonIds = ["first", "second", "third", "fourth"] as const;
type ActivityLimit = (typeof activityLimits)[number];
type StatMetricKey =
    | "projects_created"
    | "projects_collaborated"
    | "issues_collaborated"
    | "comments_made"
    | "likes_given"
    | "skill_count";

const statMetrics: ReadonlyArray<{
    Icon: LucideIcon;
    key: StatMetricKey;
    label: string;
}> = [
    { Icon: FolderGit2, key: "projects_created", label: "Projects created" },
    {
        Icon: UserRoundCheck,
        key: "projects_collaborated",
        label: "Projects collaborated",
    },
    {
        Icon: UserRoundCheck,
        key: "issues_collaborated",
        label: "Issues collaborated",
    },
    { Icon: MessageCircle, key: "comments_made", label: "Comments made" },
    { Icon: Heart, key: "likes_given", label: "Likes given" },
    { Icon: Tags, key: "skill_count", label: "Skills listed" },
];

const activityPresentation = {
    comment: {
        Icon: MessageCircle,
        label: "Project comment",
        tone: "bg-blue-100 text-blue-700",
    },
    project: {
        Icon: FolderGit2,
        label: "New project",
        tone: "bg-primarypurple/10 text-primarypurple",
    },
} as const;

function formatUtcDate(value: string, includeTime = true): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";

    return `${new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        ...(includeTime ? { timeStyle: "short" as const } : {}),
        timeZone: "UTC",
    }).format(date)}${includeTime ? " UTC" : ""}`;
}

export default function ActivityPage() {
    const [limit, setLimit] = useState<ActivityLimit>(50);
    const stats = useQuery({
        queryKey: queryKeys.currentUserStats,
        queryFn: async ({ signal }) => {
            const response = await authFetch("/api/projects/user-stats", {
                method: "GET",
                signal,
            });
            const body = await readAuthResponse<unknown>(
                response,
                "Unable to load your activity statistics."
            );
            return parseUserActivityStats(body);
        },
        staleTime: 30_000,
    });
    const activity = useQuery({
        queryKey: queryKeys.recentActivity(limit),
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({ limit: String(limit) });
            const response = await authFetch(
                `/api/projects/recent-activity?${params.toString()}`,
                { method: "GET", signal }
            );
            const body = await readAuthResponse<unknown>(
                response,
                "Unable to load recent activity."
            );
            return parseRecentActivities(body);
        },
        staleTime: 15_000,
    });

    const activities = activity.data ?? [];
    const initialActivityError =
        activity.isError && activity.data === undefined;

    return (
        <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <ActivityIcon
                        className="h-9 w-9 text-primarypurple"
                        aria-hidden="true"
                    />
                    <h1 className="text-3xl font-semibold sm:text-4xl">
                        Community Activity
                    </h1>
                </div>
                <p className="max-w-2xl text-sm text-gray-600">
                    Review your contribution totals and see the latest projects
                    and project discussions across the community.
                </p>
            </header>

            <section className="space-y-4" aria-labelledby="your-stats-heading">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="your-stats-heading" className="text-2xl font-semibold">
                        Your contribution summary
                    </h2>
                    {stats.isFetching && !stats.isPending && (
                        <span className="text-xs text-gray-500" role="status">
                            Refreshing...
                        </span>
                    )}
                </div>

                {stats.isPending && (
                    <div
                        className="rounded-2xl border border-gray-200 bg-white p-5"
                        role="status"
                        aria-label="Loading your contribution summary"
                    >
                        <div className="mb-5 flex animate-pulse items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-gray-200" />
                            <div className="space-y-2">
                                <div className="h-5 w-40 rounded bg-gray-200" />
                                <div className="h-3 w-52 rounded bg-gray-100" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {statsSkeletonIds.map((id) => (
                                <div
                                    key={id}
                                    className="h-20 animate-pulse rounded-xl bg-gray-100"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {stats.isError && !stats.isPending && (
                    <RetryAlert
                        error={stats.error}
                        fallbackMessage="Unable to load your activity statistics."
                        isRetrying={stats.isFetching}
                        onRetry={() => void stats.refetch()}
                    />
                )}

                {stats.data && !stats.isPending && (
                    <div className="overflow-hidden rounded-2xl border border-primarypurple/20 bg-white shadow-sm">
                        <div className="flex flex-col gap-5 bg-primarypurple/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <UserAvatar
                                    avatarUrl={stats.data.avatar_url}
                                    name={stats.data.full_name}
                                    size="lg"
                                />
                                <div className="min-w-0">
                                    <Link
                                        href={userProfilePath(stats.data.user_id)}
                                        className="block truncate text-xl font-semibold hover:text-primarypurple hover:underline"
                                    >
                                        {stats.data.full_name}
                                    </Link>
                                    <p className="truncate text-sm text-gray-600">
                                        {stats.data.nu_email}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                        <CalendarDays
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        Member since{" "}
                                        {formatUtcDate(
                                            stats.data.member_since,
                                            false
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="w-fit rounded-xl bg-primarypurple px-5 py-3 text-white sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                                    Activity score
                                </p>
                                <p className="font-mono text-3xl font-bold">
                                    {stats.data.activity_score}
                                </p>
                            </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-3 lg:grid-cols-6">
                            {statMetrics.map(({ Icon, key, label }) => (
                                <div key={key} className="bg-white p-4 text-center">
                                    <Icon
                                        className="mx-auto h-5 w-5 text-primarypurple"
                                        aria-hidden="true"
                                    />
                                    <dt className="mt-2 text-xs text-gray-500">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 font-mono text-xl font-semibold">
                                        {stats.data[key]}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </section>

            <section className="space-y-4" aria-labelledby="recent-activity-heading">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2
                            id="recent-activity-heading"
                            className="text-2xl font-semibold"
                        >
                            Recent community events
                        </h2>
                        <p
                            className="mt-1 text-sm text-gray-600"
                            role="status"
                            aria-live="polite"
                        >
                            {initialActivityError
                                ? "Recent activity is unavailable."
                                : activity.isFetching && !activity.isPending
                                ? "Refreshing activity..."
                                : activity.data
                                  ? `${activities.length} recent events shown.`
                                  : "Loading recent activity."}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="activity-limit"
                            className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                            Events shown
                        </label>
                        <select
                            id="activity-limit"
                            value={limit}
                            onChange={(event) =>
                                setLimit(
                                    Number(event.target.value) as ActivityLimit
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primarypurple focus:ring-2 focus:ring-primarypurple/20 sm:w-48"
                        >
                            {activityLimits.map((option) => (
                                <option key={option} value={option}>
                                    Latest {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {activity.isPending && (
                    <div
                        className="space-y-3"
                        role="status"
                        aria-label="Loading recent community activity"
                    >
                        {activitySkeletonIds.map((id) => (
                            <div
                                key={id}
                                className="flex animate-pulse gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                            >
                                <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                                    <div className="h-3 w-32 rounded bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activity.isError && !activity.isPending && (
                    <RetryAlert
                        error={activity.error}
                        fallbackMessage="Unable to load recent activity."
                        isRetrying={activity.isFetching}
                        onRetry={() => void activity.refetch()}
                    />
                )}

                {!activity.isPending &&
                    !initialActivityError &&
                    activities.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <ActivityIcon
                                className="mx-auto h-9 w-9 text-gray-400"
                                aria-hidden="true"
                            />
                            <h3 className="mt-3 text-lg font-semibold">
                                No recent activity
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                New projects and comments will appear here.
                            </p>
                        </div>
                    )}

                {!activity.isPending &&
                    !initialActivityError &&
                    activities.length > 0 && (
                        <ol className="space-y-3">
                            {activities.map((event) => {
                                const presentation =
                                    activityPresentation[event.activity_type];
                                const projectHref = projectActivityPath(event);
                                const EventIcon = presentation.Icon;

                                return (
                                    <li
                                        key={`${event.activity_type}-${event.entity_id}`}
                                    >
                                        <article className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${presentation.tone}`}
                                            >
                                                <EventIcon
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm leading-6 text-gray-700">
                                                    <Link
                                                        href={userProfilePath(
                                                            event.user_id
                                                        )}
                                                        className="font-semibold text-gray-900 hover:text-primarypurple hover:underline"
                                                    >
                                                        {event.full_name}
                                                    </Link>{" "}
                                                    {event.activity_type ===
                                                    "project" ? (
                                                        <>
                                                            created project{" "}
                                                            {projectHref && (
                                                                <Link
                                                                    href={projectHref}
                                                                    className="font-semibold text-primarypurple hover:underline"
                                                                >
                                                                    {event.entity_title}
                                                                </Link>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            commented on project{" "}
                                                            <span className="font-semibold text-gray-900">
                                                                {event.entity_title}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                                                    <span>{presentation.label}</span>
                                                    <span aria-hidden="true">•</span>
                                                    <time dateTime={event.activity_date}>
                                                        {formatUtcDate(
                                                            event.activity_date
                                                        )}
                                                    </time>
                                                </div>
                                            </div>
                                        </article>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
            </section>
        </div>
    );
}
