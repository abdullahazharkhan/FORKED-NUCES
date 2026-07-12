"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowUpRight, GitPullRequest, UsersRound } from "lucide-react";

import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";
import { PLATFORM_PRIMARY_BUTTON_CLASS } from "@/lib/platformStyles";

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
            className="space-y-6 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_18px_60px_rgba(24,15,48,0.06)] sm:p-7"
            aria-labelledby="collaborated-projects-heading"
        >
            <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-primarypurple">
                    <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                    Contributions
                </p>
                <h2 id="collaborated-projects-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                    Collaborated projects
                </h2>
                <p className="mt-1 text-sm text-black/45">Projects where this member has worked alongside another owner.</p>
            </div>

            {projectsQuery.isPending && (
                <div
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    role="status"
                    aria-label="Loading collaborated projects"
                >
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="min-h-40 animate-pulse space-y-3 rounded-3xl border border-black/[0.06] bg-[#f8f7fb] p-5"
                        >
                            <div className="h-5 w-2/3 rounded bg-black/10" />
                            <div className="h-4 w-1/2 rounded bg-black/[0.06]" />
                            <div className="h-3 w-3/4 rounded bg-black/[0.06]" />
                        </div>
                    ))}
                </div>
            )}

            {initialError && (
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
                        className="font-bold underline underline-offset-4 disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!projectsQuery.isPending && !initialError && projects.length === 0 && (
                <div className="rounded-3xl border border-dashed border-primarypurple/25 bg-[#faf9fc] px-6 py-12 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primarypurple/[0.08] text-primarypurple">
                        <UsersRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="mt-4 font-black">No collaborations yet</p>
                    <p className="mt-1 text-sm text-black/45">Collaborated projects will appear here.</p>
                </div>
            )}

            {projects.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            href={`/platform/projects/${project.project_id}`}
                            key={project.project_id}
                            className="group flex min-h-44 flex-col rounded-3xl border border-black/[0.07] bg-[#faf9fc] p-5 transition duration-300 hover:-translate-y-1 hover:border-primarypurple/25 hover:bg-white hover:shadow-[0_18px_45px_rgba(58,35,126,0.1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-black tracking-tight text-black transition group-hover:text-primarypurple">
                                    {project.title}
                                </h3>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-black/25 transition group-hover:text-primarypurple" aria-hidden="true" />
                            </div>
                            <p className="mt-auto border-t border-black/[0.06] pt-4 text-xs text-black/50">
                                by{" "}
                                <span className="font-bold text-black/70">
                                    {project.owner_full_name}
                                </span>
                                <span className="mt-1 block truncate font-semibold text-primarypurple">
                                    {project.owner_nu_email}
                                </span>
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {projectsQuery.isFetchNextPageError && (
                <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700" role="alert">
                    <span>Could not load more collaborations.</span>
                    <button
                        type="button"
                        onClick={() => void projectsQuery.fetchNextPage()}
                        disabled={projectsQuery.isFetchingNextPage}
                        className="font-bold underline underline-offset-4 disabled:opacity-60"
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
                        className={PLATFORM_PRIMARY_BUTTON_CLASS}
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
