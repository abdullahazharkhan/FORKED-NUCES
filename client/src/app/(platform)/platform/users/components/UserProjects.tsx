"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import ProjectCard, {
    type ProjectSummary,
} from "@/app/(platform)/components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

const UserProjects = ({ userid }: { userid: string }) => {
    const projectsQuery = useInfiniteQuery<PaginatedPage<ProjectSummary>>({
        queryKey: queryKeys.userProjects(userid),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/projects/by-user/${userid}?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch owned projects");
            }
            return readPaginatedArray<ProjectSummary>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const projects = useMemo(
        () =>
            projectsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [projectsQuery.data]
    );
    const initialError = projectsQuery.isError && projects.length === 0;

    return (
        <section
            className="my-6 space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6"
            aria-labelledby="owned-projects-heading"
        >
            <h2
                id="owned-projects-heading"
                className="text-3xl font-semibold underline decoration-4 decoration-primarypurple sm:text-4xl"
            >
                Projects Owned
            </h2>

            <ProjectCard
                isError={initialError}
                error={projectsQuery.error}
                isLoading={projectsQuery.isPending}
                isRetrying={projectsQuery.isFetching}
                onRetry={() => void projectsQuery.refetch()}
                showEmptyState={
                    !projectsQuery.isPending &&
                    !initialError &&
                    projects.length === 0
                }
                filteredProjects={projects}
            />

            {projectsQuery.isFetchNextPageError && (
                <div
                    className="flex items-center justify-center gap-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more owned projects.</span>
                    <button
                        type="button"
                        onClick={() => void projectsQuery.fetchNextPage()}
                        disabled={projectsQuery.isFetchingNextPage}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {projectsQuery.hasNextPage &&
                !initialError &&
                !projectsQuery.isFetchNextPageError && (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => void projectsQuery.fetchNextPage()}
                            disabled={projectsQuery.isFetchingNextPage}
                            className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {projectsQuery.isFetchingNextPage
                                ? "Loading..."
                                : "Load more projects"}
                        </button>
                    </div>
                )}
        </section>
    );
};

export default UserProjects;
