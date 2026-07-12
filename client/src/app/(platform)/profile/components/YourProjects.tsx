"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import ProjectCard, {
    type ProjectSummary,
} from "@/app/(platform)/components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

const YourProjects = () => {
    const [search, setSearch] = useState("");
    const [selectedTag, setSelectedTag] = useState("all");
    const projectsQuery = useInfiniteQuery<PaginatedPage<ProjectSummary>>({
        queryKey: queryKeys.myProjects,
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/projects?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch your projects");
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
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.forEach((project) => {
            project.tags?.forEach((tag) => tags.add(tag.tag));
        });
        return ["all", ...Array.from(tags).sort()];
    }, [projects]);
    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();
        return projects.filter((project) => {
            const matchesSearch =
                project.title.toLowerCase().includes(query) ||
                (project.owner_full_name ?? "").toLowerCase().includes(query) ||
                (project.owner_nu_email ?? "").toLowerCase().includes(query);
            const matchesTag =
                selectedTag === "all" ||
                project.tags?.some((tag) => tag.tag === selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [projects, search, selectedTag]);
    const initialError = projectsQuery.isError && projects.length === 0;

    return (
        <section
            className="my-6 space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6"
            aria-labelledby="your-projects-heading"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <h2
                    id="your-projects-heading"
                    className="text-3xl font-semibold underline decoration-4 decoration-primarypurple md:text-4xl"
                >
                    Your Projects
                </h2>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div>
                        <label className="sr-only" htmlFor="your-project-search">
                            Search your loaded projects
                        </label>
                        <input
                            id="your-project-search"
                            type="search"
                            placeholder="Search loaded projects..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors focus:border-primarypurple/80 sm:w-64"
                        />
                    </div>
                    <div>
                        <label className="sr-only" htmlFor="your-project-tag">
                            Filter loaded projects by tag
                        </label>
                        <select
                            id="your-project-tag"
                            value={selectedTag}
                            onChange={(event) => setSelectedTag(event.target.value)}
                            className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors focus:border-primarypurple/80 sm:w-44"
                        >
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag === "all" ? "All Tags" : tag}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-500" role="status" aria-live="polite">
                {projects.length} projects loaded; {filteredProjects.length} match
                the current filters.
            </p>

            <ProjectCard
                isError={initialError}
                error={projectsQuery.error}
                isLoading={projectsQuery.isPending}
                isRetrying={projectsQuery.isFetching}
                onRetry={() => void projectsQuery.refetch()}
                showEmptyState={
                    !projectsQuery.isPending &&
                    !initialError &&
                    filteredProjects.length === 0
                }
                filteredProjects={filteredProjects}
            />

            {projectsQuery.isFetchNextPageError && (
                <div
                    className="flex items-center justify-center gap-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more projects.</span>
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

export default YourProjects;
