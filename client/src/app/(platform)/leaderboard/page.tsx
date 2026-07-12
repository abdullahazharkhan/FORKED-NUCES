"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Award,
    FolderGit2,
    MessageCircle,
    Sparkles,
    Trophy,
    UserRoundCheck,
} from "lucide-react";
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
        <div className="relative isolate min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:py-12">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[#f4f3f8]" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-40 bottom-20 -z-10 h-96 w-96 rounded-full bg-primarygreen/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-32 top-64 -z-10 h-80 w-80 rounded-full bg-primarypurple/10 blur-3xl" aria-hidden="true" />

            <div className="mx-auto max-w-7xl space-y-6">
            <header className="relative isolate flex flex-col gap-8 overflow-hidden rounded-[2rem] bg-primarypurple px-6 py-8 text-white shadow-[0_24px_70px_rgba(75,40,175,0.22)] sm:px-9 sm:py-10 lg:flex-row lg:items-end lg:justify-between lg:px-12">
                <div className="landing-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primarygreen/20 blur-3xl" aria-hidden="true" />
                <div className="relative max-w-3xl">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                        Community standouts
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarygreen text-black shadow-lg shadow-black/10">
                            <Trophy className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <h1 className="text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                            Contributor leaderboard
                        </h1>
                    </div>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
                        Celebrate the builders creating projects, unblocking issues, and
                        sharing the knowledge that keeps the community moving.
                    </p>
                </div>

                <div className="relative space-y-1.5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <label
                        htmlFor="leaderboard-limit"
                        className="block text-xs font-bold uppercase tracking-[0.14em] text-white/85"
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
                        className="min-h-11 w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-bold text-black outline-none transition focus:border-primarygreen focus:ring-4 focus:ring-primarygreen/20 sm:w-48"
                    >
                        {leaderboardLimits.map((option) => (
                            <option key={option} value={option}>
                                Top {option}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <p className="px-1 text-sm font-medium text-black/55" role="status" aria-live="polite">
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
                            className="grid animate-pulse gap-4 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
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
                    <div className="rounded-[1.75rem] border border-dashed border-primarypurple/25 bg-white p-10 text-center shadow-[0_12px_35px_rgba(35,20,75,0.05)]">
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
                                    <article
                                        className={`group relative grid gap-5 overflow-hidden rounded-[1.5rem] border bg-white p-5 shadow-[0_8px_28px_rgba(35,20,75,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(35,20,75,0.1)] sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:p-6 lg:grid-cols-[4.5rem_minmax(14rem,1fr)_minmax(20rem,1.2fr)_8rem] lg:items-center ${
                                            contributor.rank <= 3
                                                ? "border-primarypurple/25"
                                                : "border-black/[0.07] hover:border-primarypurple/25"
                                        }`}
                                    >
                                        {contributor.rank <= 3 && (
                                            <span
                                                className="absolute inset-y-0 left-0 w-1 bg-primarygreen"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="flex items-center gap-3 sm:flex-col sm:justify-center sm:gap-1">
                                            <span className={`font-mono text-xl font-black ${contributor.rank <= 3 ? "text-primarypurple" : "text-black/55"}`}>
                                                #{contributor.rank}
                                            </span>
                                            {contributor.rank <= 3 && (
                                                <Award
                                                    className="h-5 w-5 text-primarypurple"
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
                                                    className="block truncate text-lg font-black tracking-[-0.02em] transition-colors hover:text-primarypurple focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primarypurple"
                                                >
                                                    {contributor.full_name}
                                                </Link>
                                                <p className="truncate text-sm text-gray-600">
                                                    {contributor.nu_email}
                                                </p>
                                            </div>
                                        </div>

                                        <dl className="grid grid-cols-3 gap-2 text-center sm:col-start-2 lg:col-start-auto">
                                            <div className="rounded-xl border border-black/[0.05] bg-[#f8f7fb] p-2.5 transition-colors group-hover:bg-primarypurple/[0.045]">
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
                                            <div className="rounded-xl border border-black/[0.05] bg-[#f8f7fb] p-2.5 transition-colors group-hover:bg-primarypurple/[0.045]">
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
                                            <div className="rounded-xl border border-black/[0.05] bg-[#f8f7fb] p-2.5 transition-colors group-hover:bg-primarypurple/[0.045]">
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

                                        <div className={`rounded-2xl px-3 py-2.5 text-center sm:col-start-2 lg:col-start-auto ${contributor.rank === 1 ? "bg-primarygreen text-black" : "bg-primarypurple/10 text-primarypurple"}`}>
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
        </div>
    );
}
