"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;
const SKELETON_IDS = ["first", "second", "third"] as const;

type Project = {
    owner_full_name: string;
    owner_nu_email: string;
    project_id: number;
    title: string;
};

const UserCollaborations = ({ userid }: { userid: string }) => {
    const projectsQuery = useInfiniteQuery<PaginatedPage<Project>>({
        queryKey: queryKeys.userCollaboratedProjects(userid),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/users/${userid}/collaborated-projects?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch collaborated projects");
            }
            return readPaginatedArray<Project>(response);
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
            aria-labelledby="collaborated-projects-heading"
        >
            <h2
                id="collaborated-projects-heading"
                className="text-3xl font-semibold underline decoration-4 decoration-primarypurple"
            >
                Collaborated Projects
            </h2>

            {projectsQuery.isPending && (
                <div
                    className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    role="status"
                    aria-label="Loading collaborated projects"
                >
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="space-y-3 rounded-xl border border-primarypurple/10 bg-white/80 p-4 shadow-sm"
                        >
                            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
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
                        {projectsQuery.error instanceof Error
                            ? projectsQuery.error.message
                            : "Failed to load collaborated projects."}
                    </span>
                    <button
                        type="button"
                        onClick={() => void projectsQuery.refetch()}
                        disabled={projectsQuery.isFetching}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!projectsQuery.isPending && !initialError && projects.length === 0 && (
                <p className="text-sm text-gray-600">
                    No collaborated projects found.
                </p>
            )}

            {projects.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            href={`/platform/projects/${project.project_id}`}
                            key={project.project_id}
                            className="flex flex-col gap-2 rounded-xl border border-primarypurple/10 bg-white/80 p-4 shadow-sm transition hover:border-primarypurple/40"
                        >
                            <h3 className="text-base font-semibold text-gray-900">
                                {project.title}
                            </h3>
                            <p className="text-xs text-gray-700">
                                by{" "}
                                <span className="font-medium">
                                    {project.owner_full_name}
                                </span>
                                <span className="block text-primarypurple underline">
                                    {project.owner_nu_email}
                                </span>
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {projectsQuery.isFetchNextPageError && (
                <div className="flex justify-center gap-3 text-sm text-red-700" role="alert">
                    <span>Could not load more collaborations.</span>
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

            {projectsQuery.hasNextPage && !projectsQuery.isFetchNextPageError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void projectsQuery.fetchNextPage()}
                        disabled={projectsQuery.isFetchingNextPage}
                        className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {projectsQuery.isFetchingNextPage
                            ? "Loading..."
                            : "Load more collaborations"}
                    </button>
                </div>
            )}
        </section>
    );
};

export default UserCollaborations;
