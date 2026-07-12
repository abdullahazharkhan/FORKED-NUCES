"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, FolderGit2, MessageCircle, Trophy, UserRoundCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { RetryAlert } from "../components/RetryAlert";
import { UserAvatar } from "../components/UserAvatar";
import { authFetch } from "@/lib/authFetch";
import { readAuthResponse } from "@/lib/authFormResponse";
import {
    parseTopContributors,
    userProfilePath,
} from "@/lib/activityData";
import { queryKeys } from "@/lib/queryKeys";

const leaderboardLimits = [10, 25, 50] as const;
const leaderboardSkeletonIds = ["first", "second", "third", "fourth"] as const;
type LeaderboardLimit = (typeof leaderboardLimits)[number];

export default function LeaderboardPage() {
    const [limit, setLimit] = useState<LeaderboardLimit>(25);
    const leaderboard = useQuery({
        queryKey: queryKeys.topContributors(limit),
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({ limit: String(limit) });
            const response = await authFetch(
                `/api/projects/top-contributors?${params.toString()}`,
                { method: "GET", signal }
            );
            const body = await readAuthResponse<unknown>(
                response,
                "Unable to load the contributor leaderboard."
            );
            return parseTopContributors(body);
        },
        staleTime: 30_000,
    });

    const contributors = leaderboard.data ?? [];
    const initialLeaderboardError =
        leaderboard.isError && leaderboard.data === undefined;

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
            <header className="flex flex-col gap-4 rounded-2xl border border-primarypurple/20 bg-primarypurple/5 p-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Trophy
                            className="h-9 w-9 text-primarypurple"
                            aria-hidden="true"
                        />
                        <h1 className="text-3xl font-semibold sm:text-4xl">
                            Contributor Leaderboard
                        </h1>
                    </div>
                    <p className="max-w-2xl text-sm text-gray-600">
                        Rankings reward project creation, issue collaboration,
                        and helpful discussion across the community.
                    </p>
                </div>

                <div className="space-y-1">
                    <label
                        htmlFor="leaderboard-limit"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                        Contributors shown
                    </label>
                    <select
                        id="leaderboard-limit"
                        value={limit}
                        onChange={(event) =>
                            setLimit(
                                Number(event.target.value) as LeaderboardLimit
                            )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primarypurple focus:ring-2 focus:ring-primarypurple/20 sm:w-48"
                    >
                        {leaderboardLimits.map((option) => (
                            <option key={option} value={option}>
                                Top {option}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <p className="text-sm text-gray-600" role="status" aria-live="polite">
                {initialLeaderboardError
                    ? "Contributor rankings are unavailable."
                    : leaderboard.isFetching && !leaderboard.isPending
                    ? "Refreshing leaderboard..."
                    : leaderboard.data
                      ? `${contributors.length} contributors ranked.`
                      : "Loading contributor rankings."}
            </p>

            {leaderboard.isPending && (
                <div
                    className="space-y-3"
                    role="status"
                    aria-label="Loading contributor leaderboard"
                >
                    {leaderboardSkeletonIds.map((id) => (
                        <div
                            key={id}
                            className="grid animate-pulse gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
                        >
                            <div className="h-12 w-12 rounded-full bg-gray-200" />
                            <div className="space-y-2">
                                <div className="h-4 w-40 rounded bg-gray-200" />
                                <div className="h-3 w-56 max-w-full rounded bg-gray-100" />
                            </div>
                            <div className="h-10 w-28 rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
            )}

            {leaderboard.isError && !leaderboard.isPending && (
                <RetryAlert
                    error={leaderboard.error}
                    fallbackMessage="Unable to load the contributor leaderboard."
                    isRetrying={leaderboard.isFetching}
                    onRetry={() => void leaderboard.refetch()}
                />
            )}

            {!leaderboard.isPending &&
                !initialLeaderboardError &&
                contributors.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <Award
                            className="mx-auto h-9 w-9 text-gray-400"
                            aria-hidden="true"
                        />
                        <h2 className="mt-3 text-lg font-semibold">
                            No contributors ranked yet
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Rankings will appear as members create projects,
                            collaborate, and comment.
                        </p>
                    </div>
                )}

            {!leaderboard.isPending &&
                !initialLeaderboardError &&
                contributors.length > 0 && (
                    <section aria-labelledby="rankings-heading">
                        <h2 id="rankings-heading" className="sr-only">
                            Ranked contributors
                        </h2>
                        <ol className="space-y-3">
                            {contributors.map((contributor) => (
                                <li key={contributor.user_id}>
                                    <article className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primarypurple/40 sm:grid-cols-[4rem_minmax(0,1fr)] lg:grid-cols-[4rem_minmax(14rem,1fr)_minmax(20rem,1.2fr)_8rem] lg:items-center">
                                        <div className="flex items-center gap-3 sm:flex-col sm:justify-center sm:gap-1">
                                            <span className="font-mono text-xl font-bold text-primarypurple">
                                                #{contributor.rank}
                                            </span>
                                            {contributor.rank <= 3 && (
                                                <Award
                                                    className="h-5 w-5 text-amber-500"
                                                    aria-label="Top three contributor"
                                                />
                                            )}
                                        </div>

                                        <div className="flex min-w-0 items-center gap-3">
                                            <UserAvatar
                                                avatarUrl={contributor.avatar_url}
                                                name={contributor.full_name}
                                            />
                                            <div className="min-w-0">
                                                <Link
                                                    href={userProfilePath(
                                                        contributor.user_id
                                                    )}
                                                    className="block truncate text-lg font-semibold hover:text-primarypurple hover:underline"
                                                >
                                                    {contributor.full_name}
                                                </Link>
                                                <p className="truncate text-sm text-gray-600">
                                                    {contributor.nu_email}
                                                </p>
                                            </div>
                                        </div>

                                        <dl className="grid grid-cols-3 gap-2 text-center sm:col-start-2 lg:col-start-auto">
                                            <div className="rounded-lg bg-gray-50 p-2">
                                                <FolderGit2
                                                    className="mx-auto h-4 w-4 text-primarypurple"
                                                    aria-hidden="true"
                                                />
                                                <dt className="mt-1 text-[11px] text-gray-500">
                                                    Projects
                                                </dt>
                                                <dd className="font-mono text-sm font-semibold">
                                                    {contributor.projects_created}
                                                </dd>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 p-2">
                                                <UserRoundCheck
                                                    className="mx-auto h-4 w-4 text-primarypurple"
                                                    aria-hidden="true"
                                                />
                                                <dt className="mt-1 text-[11px] text-gray-500">
                                                    Issues
                                                </dt>
                                                <dd className="font-mono text-sm font-semibold">
                                                    {contributor.issues_collaborated}
                                                </dd>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 p-2">
                                                <MessageCircle
                                                    className="mx-auto h-4 w-4 text-primarypurple"
                                                    aria-hidden="true"
                                                />
                                                <dt className="mt-1 text-[11px] text-gray-500">
                                                    Comments
                                                </dt>
                                                <dd className="font-mono text-sm font-semibold">
                                                    {contributor.comments_made}
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="rounded-xl bg-primarypurple/10 px-3 py-2 text-center text-primarypurple sm:col-start-2 lg:col-start-auto">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide">
                                                Score
                                            </p>
                                            <p className="font-mono text-2xl font-bold">
                                                {contributor.activity_score}
                                            </p>
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
        </div>
    );
}
