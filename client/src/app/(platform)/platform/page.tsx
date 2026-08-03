"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";

import ProjectCard, {
    type ProjectSummary,
} from "../components/ProjectCard";
import { PlatformPageHeader } from "../components/PlatformPageHeader";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_HEADER_BADGE_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SELECT_CLASS,
} from "@/lib/platformStyles";
import { queryKeys } from "@/lib/queryKeys";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const PAGE_SIZE = 24;
type IssueStatus = "all" | "open" | "closed" | "without-open";
type ProjectOrdering =
    | "newest"
    | "oldest"
    | "updated"
    | "popular"
    | "discussed"
    | "needs-help";

const Platform = () => {
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState("");
    const [issueStatus, setIssueStatus] = useState<IssueStatus>("all");
    const [ordering, setOrdering] = useState<ProjectOrdering>("newest");
    const debouncedSearch = useDebouncedValue(search.trim(), 350);
    const debouncedTag = useDebouncedValue(tag.trim(), 350);

    const filters = useMemo(
        () => ({
            issueStatus,
            limit: PAGE_SIZE,
            ordering,
            search: debouncedSearch,
            tag: debouncedTag,
        }),
        [debouncedSearch, debouncedTag, issueStatus, ordering]
    );

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isError,
        isFetchNextPageError,
        isFetching,
        isFetchingNextPage,
        isPending,
        refetch,
    } = useInfiniteQuery<PaginatedPage<ProjectSummary>>({
        queryKey: queryKeys.projectList(filters),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                issue_status: issueStatus,
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
                ordering,
            });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (debouncedTag) params.set("tag", debouncedTag);

            const response = await authFetch(
                `/api/projects/all?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) throw new Error("Failed to fetch projects");
            return readPaginatedArray<ProjectSummary>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const projects = useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data]
    );
    const totalCount = data?.pages[0]?.totalCount;
    const initialError = isError && projects.length === 0;
    const showEmptyState = !isPending && !initialError && projects.length === 0;
    const isDebouncing =
        search.trim() !== debouncedSearch || tag.trim() !== debouncedTag;
    const hasActiveFilters =
        search.length > 0 ||
        tag.length > 0 ||
        issueStatus !== "all" ||
        ordering !== "newest";

    const clearFilters = () => {
        setSearch("");
        setTag("");
        setIssueStatus("all");
        setOrdering("newest");
    };

    return (
        <div className="mx-auto w-full max-w-[90rem] space-y-7 px-4 py-6 sm:px-6 lg:space-y-10 lg:px-8 lg:py-10">
            <PlatformPageHeader
                eyebrow="Campus build index"
                title={<>Browse the work. <span className="text-primarygreen">Find your place.</span></>}
                description="A working directory of what FASTians are shipping, the issues still open, and the teams looking for another set of hands."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <span className="font-mono text-2xl font-black tabular-nums text-primarygreen">
                            {typeof totalCount === "number" ? totalCount : projects.length}
                        </span>
                        <span className="font-mono text-[0.65rem] font-semibold uppercase leading-4 tracking-[0.12em] text-white/90">
                            Project records<br />in this index
                        </span>
                    </div>
                }
            />

            <section
                className="rounded-3xl border border-black/[0.07] bg-white/80 p-5 shadow-[0_18px_50px_rgba(40,20,90,0.06)] backdrop-blur-sm sm:p-6"
                aria-labelledby="explore-filter-heading"
            >
                <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6">
                    <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-primarypurple/[0.035] p-4 lg:p-5">
                        <div>
                            <h2 id="explore-filter-heading" className="flex items-center gap-2 text-base font-black tracking-[-0.02em]">
                            <SlidersHorizontal className="h-4 w-4 text-primarypurple" aria-hidden="true" />
                                Refine the index
                            </h2>
                            <p className="mt-2 max-w-[28ch] text-xs leading-5 text-black/60">Filter by technology, issue activity, or the people behind the work.</p>
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-black/[0.07] bg-white px-3 text-xs font-bold text-black/60 shadow-sm transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-primarypurple/20 hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="grid content-center gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Search projects</span>
                        <span className="relative block">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" aria-hidden="true" />
                            <input
                                id="project-search"
                                type="search"
                                placeholder="Name or creator"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className={`${PLATFORM_INPUT_CLASS} pl-11`}
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Technology tag</span>
                        <input
                            id="project-tag-filter"
                            type="search"
                            placeholder="e.g. frontend"
                            value={tag}
                            onChange={(event) => setTag(event.target.value)}
                            className={PLATFORM_INPUT_CLASS}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Issue activity</span>
                        <select
                            id="project-issue-filter"
                            value={issueStatus}
                            onChange={(event) => setIssueStatus(event.target.value as IssueStatus)}
                            className={PLATFORM_SELECT_CLASS}
                        >
                            <option value="all">All issue states</option>
                            <option value="open">Has open issues</option>
                            <option value="closed">Has closed issues</option>
                            <option value="without-open">No open issues</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Sort by</span>
                        <select
                            id="project-ordering"
                            value={ordering}
                            onChange={(event) => setOrdering(event.target.value as ProjectOrdering)}
                            className={PLATFORM_SELECT_CLASS}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="updated">Recently updated</option>
                            <option value="popular">Most liked</option>
                            <option value="discussed">Most discussed</option>
                            <option value="needs-help">Needs help</option>
                        </select>
                    </label>
                    </div>
                </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-white/55 px-5 py-4 shadow-[0_10px_30px_rgba(40,20,90,0.035)] backdrop-blur-sm">
                <div>
                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primarypurple">Directory / community work</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Project directory</h2>
                </div>
                <p className="rounded-xl bg-primarypurple/[0.045] px-3.5 py-2.5 font-mono text-[0.68rem] font-medium tabular-nums text-black/60" role="status" aria-live="polite">
                {isDebouncing || (isFetching && !isFetchingNextPage)
                    ? "Updating project results..."
                    : totalCount !== null && totalCount !== undefined
                        ? `Showing ${projects.length} of ${totalCount} projects.`
                        : `${projects.length} projects loaded.`}
                </p>
            </div>

            <ProjectCard
                isError={initialError}
                error={error}
                isLoading={isPending}
                isRetrying={isFetching}
                onRetry={() => void refetch()}
                showEmptyState={showEmptyState}
                filteredProjects={projects}
            />

            {isFetchNextPageError && (
                <div
                    className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-sm text-red-700 shadow-[0_10px_28px_rgba(185,28,28,0.07)]"
                    role="alert"
                >
                    <span>Could not load more projects.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 font-bold underline underline-offset-4 transition-colors hover:bg-red-100"
                    >
                        Retry
                    </button>
                </div>
            )}

            {hasNextPage && !initialError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className={PLATFORM_PRIMARY_BUTTON_CLASS}
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load more projects"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Platform;
