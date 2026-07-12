"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import ProjectCard, {
    type ProjectSummary,
} from "../components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
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

    return (
        <div className="space-y-6 p-6 px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                    Explore FORK&apos;d Projects
                </h1>

                <div className="grid w-full gap-2 sm:grid-cols-2 xl:max-w-4xl xl:grid-cols-4">
                    <label className="sr-only" htmlFor="project-search">
                        Search projects
                    </label>
                    <input
                        id="project-search"
                        type="search"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    />

                    <label className="sr-only" htmlFor="project-tag-filter">
                        Filter by exact tag
                    </label>
                    <input
                        id="project-tag-filter"
                        type="search"
                        placeholder="Filter by exact tag"
                        value={tag}
                        onChange={(event) => setTag(event.target.value)}
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    />

                    <label className="sr-only" htmlFor="project-issue-filter">
                        Filter by issue status
                    </label>
                    <select
                        id="project-issue-filter"
                        value={issueStatus}
                        onChange={(event) =>
                            setIssueStatus(event.target.value as IssueStatus)
                        }
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    >
                        <option value="all">All issue states</option>
                        <option value="open">Has open issues</option>
                        <option value="closed">Has closed issues</option>
                        <option value="without-open">No open issues</option>
                    </select>

                    <label className="sr-only" htmlFor="project-ordering">
                        Sort projects
                    </label>
                    <select
                        id="project-ordering"
                        value={ordering}
                        onChange={(event) =>
                            setOrdering(event.target.value as ProjectOrdering)
                        }
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="updated">Recently updated</option>
                        <option value="popular">Most liked</option>
                        <option value="discussed">Most discussed</option>
                        <option value="needs-help">Needs help</option>
                    </select>
                </div>
            </div>

            <p className="text-sm text-gray-600" role="status" aria-live="polite">
                {isDebouncing || (isFetching && !isFetchingNextPage)
                    ? "Updating project results..."
                    : totalCount !== null && totalCount !== undefined
                        ? `Showing ${projects.length} of ${totalCount} projects.`
                        : `${projects.length} projects loaded.`}
            </p>

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
                    className="flex items-center justify-center gap-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more projects.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        className="font-semibold underline"
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
                        className="rounded-xl bg-black px-6 py-2 font-semibold text-white hover:bg-black/80 disabled:opacity-60"
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load more projects"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Platform;
