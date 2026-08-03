"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";

import ProjectCard, {
    type ProjectSummary,
} from "@/app/(platform)/components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;
const USER_PRIMARY_BUTTON_CLASS =
    "inline-flex min-h-11 items-center justify-center rounded-xl border border-primarypurple/10 bg-primarypurple px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(104,67,231,0.2)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#5d32eb] hover:shadow-[0_12px_28px_rgba(104,67,231,0.26)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/20 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none";

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
            className="space-y-6 rounded-3xl border border-black/[0.06] bg-gradient-to-br from-white via-white to-primarypurple/[0.025] p-5 shadow-[0_18px_55px_rgba(24,15,48,0.07)] sm:p-7"
            aria-labelledby="owned-projects-heading"
        >
            <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-primarypurple">
                    <FolderKanban className="h-4 w-4" aria-hidden="true" />
                    Portfolio
                </p>
                <h2 id="owned-projects-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                    Projects owned
                </h2>
                <p className="mt-1 text-sm text-black/45">Original work this member has shared with the community.</p>
            </div>

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
                    className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more owned projects.</span>
                    <button
                        type="button"
                        onClick={() => void projectsQuery.fetchNextPage()}
                        disabled={projectsQuery.isFetchingNextPage}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 font-bold shadow-sm transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-60"
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
                            className={USER_PRIMARY_BUTTON_CLASS}
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
