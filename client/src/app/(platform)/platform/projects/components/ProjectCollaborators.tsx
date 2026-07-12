"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";

import { UserAvatar } from "@/app/(platform)/components/UserAvatar";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;
const SKELETON_IDS = ["first", "second", "third"] as const;

type Collaborator = {
    avatar_url?: string | null;
    full_name: string;
    nu_email: string;
    user_id: number;
};

const ProjectCollaborators = ({ projectid }: { projectid: number }) => {
    const collaboratorsQuery = useInfiniteQuery<PaginatedPage<Collaborator>>({
        queryKey: queryKeys.projectCollaborators(projectid),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/projects/${projectid}/collaborators?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch collaborators");
            }
            return readPaginatedArray<Collaborator>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });
    const collaborators = useMemo(
        () =>
            collaboratorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [collaboratorsQuery.data]
    );
    const initialError =
        collaboratorsQuery.isError && collaborators.length === 0;

    return (
        <section
            className="space-y-3 border-t border-primarypurple/20 pt-4"
            aria-labelledby="project-collaborators-heading"
        >
            <div className="flex flex-col gap-1">
                <h2 id="project-collaborators-heading" className="text-lg font-semibold">
                    Collaborators
                </h2>
                <p className="text-xs text-gray-600">
                    Users who have collaborated on issues for this project.
                </p>
            </div>

            {collaboratorsQuery.isPending && (
                <div
                    className="space-y-3"
                    role="status"
                    aria-label="Loading project collaborators"
                >
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="flex animate-pulse items-center gap-3 rounded-lg border border-primarypurple/10 bg-white/70 px-3 py-2"
                        >
                            <div className="h-10 w-10 rounded-full bg-gray-200" />
                            <div className="flex flex-col gap-1">
                                <div className="h-3 w-32 rounded bg-gray-200" />
                                <div className="h-3 w-40 rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {initialError && (
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>
                        {collaboratorsQuery.error instanceof Error
                            ? collaboratorsQuery.error.message
                            : "Failed to load collaborators."}
                    </span>
                    <button
                        type="button"
                        onClick={() => void collaboratorsQuery.refetch()}
                        disabled={collaboratorsQuery.isFetching}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!collaboratorsQuery.isPending &&
                !initialError &&
                collaborators.length === 0 && (
                    <p className="text-sm text-gray-600">
                        No collaborators have been added for this project yet.
                    </p>
                )}

            {collaborators.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {collaborators.map((collaborator) => (
                        <Link
                            href={`/platform/users/${collaborator.user_id}`}
                            key={collaborator.user_id}
                            className="flex items-center gap-3 rounded-lg border border-primarypurple/10 bg-white/80 px-3 py-2 transition hover:border-primarypurple/40"
                        >
                            <UserAvatar
                                avatarUrl={collaborator.avatar_url ?? null}
                                name={collaborator.full_name}
                            />
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-gray-900">
                                    {collaborator.full_name || "Unnamed User"}
                                </span>
                                <span className="truncate text-xs text-gray-600">
                                    {collaborator.nu_email}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {collaboratorsQuery.isFetchNextPageError && (
                <div className="flex justify-center gap-3 text-sm text-red-700" role="alert">
                    <span>Could not load more collaborators.</span>
                    <button
                        type="button"
                        onClick={() => void collaboratorsQuery.fetchNextPage()}
                        disabled={collaboratorsQuery.isFetchingNextPage}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {collaboratorsQuery.hasNextPage &&
                !collaboratorsQuery.isFetchNextPageError && (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => void collaboratorsQuery.fetchNextPage()}
                            disabled={collaboratorsQuery.isFetchingNextPage}
                            className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {collaboratorsQuery.isFetchingNextPage
                                ? "Loading..."
                                : "Load more collaborators"}
                        </button>
                    </div>
                )}
        </section>
    );
};

export default ProjectCollaborators;
