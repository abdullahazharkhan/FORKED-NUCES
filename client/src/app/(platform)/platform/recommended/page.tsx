"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import ProjectCard from "../../components/ProjectCard";
import { authFetch } from "@/lib/authFetch";
import type { PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

type RecommendationMode =
    | "spotlight"
    | "skill-match"
    | "with-issues"
    | "without-issues"
    | "network";

type RecommendationProject = {
    project_id: number;
    title: string;
    owner_full_name: string;
    owner_nu_email: string;
    created_at?: string;
    updated_at?: string;
    likes_count?: number;
    comments_count?: number;
    comment_count?: number;
    tags: Array<{ tag: string }>;
    issues_count?: number;
    open_issues?: number;
    closed_issues?: number;
    user_has_liked?: boolean;
    user_has_commented?: boolean;
    user_has_collaborated?: boolean;
    collaborators?: Array<{ user_id?: number; nu_email?: string }>;
    collaborator_details?: Array<{ user_id?: number; nu_email?: string }>;
    interactions?: Array<{ user_id?: number; type?: string; action?: string }>;
};

type RecommendedApiResponse = {
    projects: RecommendationProject[];
    mode: string;
    message?: string;
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
};

type RecommendationPage = PaginatedPage<RecommendationProject> & {
    message?: string;
    mode: string;
};

const recommendationOptions: Array<{
    id: RecommendationMode;
    label: string;
    helper: string;
}> = [
    {
        id: "spotlight",
        label: "Spotlight",
        helper: "Fresh and noteworthy picks",
    },
    { id: "skill-match", label: "Skill Match", helper: "Matches your skills" },
    { id: "with-issues", label: "Open Issues", helper: "Needs contributors" },
    {
        id: "without-issues",
        label: "Resolved & Stable",
        helper: "No open issues",
    },
    {
        id: "network",
        label: "From Your Network",
        helper: "From connected contributors",
    },
];

const RecommendedProjects = () => {
    const [search, setSearch] = useState("");
    const [selectedTag, setSelectedTag] = useState("all");
    const [recommendationMode, setRecommendationMode] =
        useState<RecommendationMode>("spotlight");

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
    } = useInfiniteQuery<RecommendationPage>({
        queryKey: queryKeys.recommendedProjectMode(
            recommendationMode,
            PAGE_SIZE
        ),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const requestedOffset =
                typeof pageParam === "number" ? pageParam : 0;
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                mode: recommendationMode,
                offset: String(requestedOffset),
            });
            const response = await authFetch(
                `/api/projects/recommended?${params.toString()}`,
                { method: "GET", signal }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch recommended projects");
            }

            const body = (await response.json()) as Partial<RecommendedApiResponse>;
            if (!Array.isArray(body.projects)) {
                throw new Error(
                    "The recommendation service returned an invalid response"
                );
            }

            const limit =
                typeof body.limit === "number" && body.limit > 0
                    ? body.limit
                    : PAGE_SIZE;
            const offset =
                typeof body.offset === "number" && body.offset >= 0
                    ? body.offset
                    : requestedOffset;
            const totalCount =
                typeof body.total === "number" && body.total >= 0
                    ? body.total
                    : null;

            return {
                items: body.projects,
                limit,
                message: body.message,
                mode: body.mode || recommendationMode,
                nextOffset: body.has_more === true ? offset + limit : null,
                offset,
                totalCount,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const projects = useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data]
    );

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.forEach((project) => {
            project.tags.forEach((tag) => tags.add(tag.tag));
        });
        return ["all", ...Array.from(tags).sort()];
    }, [projects]);

    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesSearch =
                project.title.toLowerCase().includes(query) ||
                project.owner_full_name.toLowerCase().includes(query) ||
                project.owner_nu_email.toLowerCase().includes(query);
            const matchesTag =
                selectedTag === "all" ||
                project.tags.some((tag) => tag.tag === selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [projects, search, selectedTag]);

    const initialError = isError && projects.length === 0;
    const modeMessage = data?.pages.find((page) => page.message)?.message;
    const totalCount = data?.pages[0]?.totalCount;
    const showEmptyState =
        !isPending && !initialError && filteredProjects.length === 0;

    const selectMode = (mode: RecommendationMode) => {
        setRecommendationMode(mode);
        setSelectedTag("all");
    };

    return (
        <div className="space-y-6 p-6 px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                    Recommended FORK&apos;d Projects
                </h1>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <label className="sr-only" htmlFor="recommendation-search">
                        Search loaded recommendations
                    </label>
                    <input
                        id="recommendation-search"
                        type="search"
                        placeholder="Search loaded recommendations..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full max-w-md rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    />

                    <label className="sr-only" htmlFor="recommendation-tag">
                        Filter loaded recommendations by tag
                    </label>
                    <select
                        id="recommendation-tag"
                        value={selectedTag}
                        onChange={(event) => setSelectedTag(event.target.value)}
                        className="w-full max-w-xs rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    >
                        {allTags.map((tag) => (
                            <option key={tag} value={tag}>
                                {tag === "all" ? "All Tags" : tag}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Recommendation Mode
                </p>
                <div className="flex flex-wrap gap-2">
                    {recommendationOptions.map((option) => {
                        const isActive = recommendationMode === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => selectMode(option.id)}
                                className={`rounded-full border px-4 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primarypurple/40 ${
                                    isActive
                                        ? "border-primarypurple bg-primarypurple text-white"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-primarypurple/60"
                                }`}
                                title={option.helper}
                            >
                                <span className="font-semibold">
                                    {option.label}
                                </span>
                                {isActive && (
                                    <span className="ml-1 hidden text-xs text-white/80 sm:inline">
                                        — {option.helper}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {modeMessage && (
                    <div className="rounded-lg border border-primarypurple/20 bg-primarypurple/5 px-4 py-2 text-sm text-primarypurple">
                        {modeMessage}
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-600" role="status" aria-live="polite">
                {isFetching && !isFetchingNextPage
                    ? "Updating recommendations..."
                    : totalCount !== null && totalCount !== undefined
                      ? `Showing ${projects.length} of ${totalCount} recommendations.`
                      : `${projects.length} recommendations loaded.`}
            </p>

            <ProjectCard
                isError={initialError}
                error={error}
                isLoading={isPending}
                isRetrying={isFetching}
                onRetry={() => void refetch()}
                showEmptyState={showEmptyState}
                filteredProjects={filteredProjects}
                basePath="/platform/recommended"
            />

            {isFetchNextPageError && (
                <div
                    className="flex items-center justify-center gap-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more recommendations.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {hasNextPage && !initialError && !isFetchNextPageError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-xl bg-black px-6 py-2 font-semibold text-white hover:bg-black/80 disabled:opacity-60"
                    >
                        {isFetchingNextPage
                            ? "Loading more..."
                            : "Load more recommendations"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecommendedProjects;
