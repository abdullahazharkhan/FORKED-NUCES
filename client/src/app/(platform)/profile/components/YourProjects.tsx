"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FolderKanban, Search } from "lucide-react";

import ProjectCard, {
    type ProjectSummary,
} from "@/app/(platform)/components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SELECT_CLASS,
} from "@/lib/platformStyles";

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
            className="my-6 space-y-6 border-y border-black/15 bg-white/80 p-5 sm:p-7"
            aria-labelledby="your-projects-heading"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-primarypurple">
                        <FolderKanban className="h-4 w-4" aria-hidden="true" />
                        Your portfolio
                    </p>
                    <h2 id="your-projects-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                        Projects you own
                    </h2>
                    <p className="mt-1 text-sm text-black/45">Open a project to manage its details, issues, and collaborators.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="block sm:w-64">
                        <span className="sr-only">Search your loaded projects</span>
                        <span className="relative block">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" aria-hidden="true" />
                            <input
                                id="your-project-search"
                                type="search"
                                placeholder="Search your projects"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className={`${PLATFORM_INPUT_CLASS} pl-11`}
                            />
                        </span>
                    </label>
                    <label className="block sm:w-44">
                        <span className="sr-only">Filter loaded projects by tag</span>
                        <select
                            id="your-project-tag"
                            value={selectedTag}
                            onChange={(event) => setSelectedTag(event.target.value)}
                            className={PLATFORM_SELECT_CLASS}
                        >
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag === "all" ? "All Tags" : tag}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <p className="text-xs font-medium text-black/45" role="status" aria-live="polite">
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
                            className={PLATFORM_PRIMARY_BUTTON_CLASS}
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
