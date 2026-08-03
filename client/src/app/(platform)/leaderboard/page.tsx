"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Award,
    FolderGit2,
    MessageCircle,
    UserRoundCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { RetryAlert } from "../components/RetryAlert";
import { UserAvatar } from "../components/UserAvatar";
import { PlatformPageHeader } from "../components/PlatformPageHeader";
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
        <div className="px-5 py-8 sm:px-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-8">
            <PlatformPageHeader
                eyebrow="Community standouts"
                title={<>Contributor <span className="text-primarygreen">leaderboard.</span></>}
                description="A working record of the builders creating projects, unblocking issues, and sharing useful knowledge across the community."
                actions={
                <div className="relative space-y-1.5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                    <label
                        htmlFor="leaderboard-limit"
                        className="block text-xs font-bold tracking-wide text-white/90"
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
                        className="min-h-11 w-full rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-bold text-black outline-none transition hover:border-primarygreen focus:border-primarygreen focus:ring-4 focus:ring-primarygreen/20 sm:w-48"
                    >
                        {leaderboardLimits.map((option) => (
                            <option key={option} value={option}>
                                Top {option}
                            </option>
                        ))}
                    </select>
                </div>
                }
            />

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
                    className="space-y-3 rounded-[1.75rem] border border-black/[0.05] bg-white p-3 shadow-[0_16px_45px_rgba(42,25,86,0.05)]"
                    role="status"
                    aria-label="Loading contributor leaderboard"
                >
                    {leaderboardSkeletonIds.map((id) => (
                        <div
                            key={id}
                            className="grid animate-pulse gap-4 rounded-2xl bg-[#f7f6fa] p-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
                        >
                            <div className="h-12 w-12 rounded-xl bg-gray-200" />
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
                    <div className="rounded-[1.75rem] border border-dashed border-primarypurple/25 bg-white p-10 text-center shadow-[0_16px_45px_rgba(42,25,86,0.05)]">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/[0.08] text-primarypurple">
                            <Award className="h-7 w-7" aria-hidden="true" />
                        </span>
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
                        <ol className="space-y-3 rounded-[1.75rem] border border-black/[0.06] bg-white p-3 shadow-[0_18px_55px_rgba(42,25,86,0.06)] sm:p-4">
                            {contributors.map((contributor) => (
                                <li key={contributor.user_id}>
                                    <article
                                        className={`group relative grid gap-5 overflow-hidden rounded-2xl border bg-[#faf9fc] p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(55,34,110,0.07)] active:translate-y-0 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:p-6 lg:grid-cols-[4.5rem_minmax(14rem,1fr)_minmax(20rem,1.2fr)_8rem] lg:items-center ${
                                            contributor.rank <= 3
                                                ? "border-primarypurple/15 bg-primarypurple/[0.03]"
                                                : "border-black/[0.045] hover:border-primarypurple/15"
                                        }`}
                                    >
                                        {contributor.rank <= 3 && (
                                            <span
                                                className="absolute inset-y-0 left-0 w-1 bg-primarygreen"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="flex items-center gap-3 sm:flex-col sm:justify-center sm:gap-1">
                                            <span className={`font-jaro text-4xl leading-none ${contributor.rank <= 3 ? "text-primarypurple" : "text-black/45"}`}>
                                                {String(contributor.rank).padStart(2, "0")}
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
                                            <div className="rounded-xl bg-white/80 px-2.5 py-2 ring-1 ring-black/[0.04] transition-colors group-hover:bg-primarypurple/[0.04]">
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
                                            <div className="rounded-xl bg-white/80 px-2.5 py-2 ring-1 ring-black/[0.04] transition-colors group-hover:bg-primarypurple/[0.04]">
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
                                            <div className="rounded-xl bg-white/80 px-2.5 py-2 ring-1 ring-black/[0.04] transition-colors group-hover:bg-primarypurple/[0.04]">
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

                                        <div className={`rounded-2xl px-3 py-2.5 text-center sm:col-start-2 lg:col-start-auto ${contributor.rank === 1 ? "bg-primarygreen/80 text-black shadow-[0_8px_20px_rgba(188,255,0,0.18)]" : "bg-primarypurple/10 text-primarypurple"}`}>
                                            <p className="text-[11px] font-semibold tracking-wide">
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
