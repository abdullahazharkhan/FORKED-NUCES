"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";

import ProjectCard from "../../components/ProjectCard";
import { PlatformPageHeader } from "../../components/PlatformPageHeader";
import { authFetch } from "@/lib/authFetch";
import type { PaginatedPage } from "@/lib/pagination";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_HEADER_BADGE_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SELECT_CLASS,
} from "@/lib/platformStyles";
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
    owner_avatar_url?: string | null;
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
    { id: "skill-match", label: "Skill match", helper: "Matches your skills" },
    { id: "with-issues", label: "Open issues", helper: "Needs contributors" },
    {
        id: "without-issues",
        label: "Resolved & stable",
        helper: "No open issues",
    },
    {
        id: "network",
        label: "From your network",
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
        <div className="mx-auto w-full max-w-[90rem] space-y-8 px-5 py-8 sm:px-8 lg:space-y-11 lg:py-12">
            <PlatformPageHeader
                eyebrow="Your signal desk"
                title={<>A shorter route to <span className="text-primarygreen">relevant work.</span></>}
                description="This feed reads your skills, network, and current project activity to surface work that is more likely to fit."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <Sparkles className="h-6 w-6 text-primarygreen" aria-hidden="true" />
                        <span className="font-mono text-[0.68rem] font-semibold uppercase leading-4 tracking-[0.1em] text-white/90">Personalized<br />project picks</span>
                    </div>
                }
            />

            <section className="border-y border-black/15 bg-white/75 px-5 py-6 sm:px-6" aria-labelledby="recommendation-mode-heading">
                <div className="grid gap-7 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-0">
                    <div className="lg:pr-6">
                        <h2 id="recommendation-mode-heading" className="text-base font-black tracking-[-0.02em]">Tune the feed</h2>
                        <p className="mt-2 max-w-[27ch] text-xs leading-5 text-black/60">Search the loaded set or choose the signal shaping this directory.</p>
                    </div>
                    <div className="grid gap-5 border-black/10 sm:grid-cols-2 lg:border-l lg:pl-6">
                        <label className="block">
                            <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Search loaded results</span>
                            <span className="relative block">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" aria-hidden="true" />
                                <input
                                    id="recommendation-search"
                                    type="search"
                                    placeholder="Project or creator"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className={`${PLATFORM_INPUT_CLASS} pl-11`}
                                />
                            </span>
                        </label>
                        <label className="block">
                            <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Technology</span>
                            <select
                                id="recommendation-tag"
                                value={selectedTag}
                                onChange={(event) => setSelectedTag(event.target.value)}
                                className={PLATFORM_SELECT_CLASS}
                            >
                                {allTags.map((tag) => (
                                    <option key={tag} value={tag}>
                                        {tag === "all" ? "All tags" : tag}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="mt-7 grid border-l border-t border-black/15 sm:grid-cols-2 lg:grid-cols-5">
                    {recommendationOptions.map((option) => {
                        const isActive = recommendationMode === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => selectMode(option.id)}
                                className={`relative min-h-[5rem] border-b border-r border-black/15 p-3 text-left transition-[background-color,color,transform] duration-200 active:translate-y-px focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primarypurple ${
                                    isActive
                                        ? "bg-primarypurple text-white"
                                        : "bg-white/50 text-black hover:bg-primarypurple/[0.05] hover:text-primarypurple"
                                }`}
                            >
                                {isActive && <span className="absolute inset-x-0 bottom-0 h-1 bg-primarygreen" aria-hidden="true" />}
                                <span className="block text-sm font-black">
                                    {option.label}
                                </span>
                                <span className={`mt-1.5 block font-mono text-[0.62rem] leading-4 ${isActive ? "text-white/90" : "text-black/60"}`}>
                                    {option.helper}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {modeMessage && (
                    <div className="mt-5 border-l-2 border-primarypurple bg-primarypurple/[0.05] px-4 py-3 text-sm font-medium text-primarypurple">
                        {modeMessage}
                    </div>
                )}
            </section>

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-5">
                <div>
                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primarypurple">Directory / curated feed</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Recommended projects</h2>
                </div>
                <p className="border-l-2 border-primarygreen pl-3 font-mono text-[0.68rem] font-medium tabular-nums text-black/60" role="status" aria-live="polite">
                    {isFetching && !isFetchingNextPage
                        ? "Updating recommendations..."
                        : totalCount !== null && totalCount !== undefined
                          ? `Showing ${projects.length} of ${totalCount} recommendations.`
                          : `${projects.length} recommendations loaded.`}
                </p>
            </div>

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
                    className="flex flex-wrap items-center justify-center gap-3 border-y border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more recommendations.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="font-bold underline underline-offset-4 disabled:opacity-60"
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
                        className={PLATFORM_PRIMARY_BUTTON_CLASS}
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
