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
        <div className="mx-auto w-full max-w-7xl space-y-7 px-5 py-8 sm:px-8 lg:space-y-9 lg:py-10">
            <PlatformPageHeader
                eyebrow="Made for you"
                title={<>A smarter way to find your <span className="text-primarygreen">next build.</span></>}
                description="Recommendations adapt to your skills, network, and the kinds of projects that need help right now."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <Sparkles className="h-6 w-6 text-primarygreen" aria-hidden="true" />
                        <span className="text-sm font-bold">Personalized picks</span>
                    </div>
                }
            />

            <section className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_18px_60px_rgba(24,15,48,0.06)] sm:p-6" aria-labelledby="recommendation-mode-heading">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 id="recommendation-mode-heading" className="text-base font-black">Choose your discovery mode</h2>
                        <p className="mt-1 text-xs text-black/45">Switch perspectives without losing your place.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold text-black/55">Search loaded results</span>
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
                            <span className="mb-2 block text-xs font-bold text-black/55">Technology</span>
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

                <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {recommendationOptions.map((option) => {
                        const isActive = recommendationMode === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => selectMode(option.id)}
                                className={`min-h-[4.5rem] rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/20 ${
                                    isActive
                                        ? "border-primarypurple bg-primarypurple text-white shadow-[0_12px_28px_rgba(111,67,254,0.2)]"
                                        : "border-black/[0.08] bg-[#f8f7fb] text-black hover:border-primarypurple/30 hover:bg-primarypurple/[0.04]"
                                }`}
                            >
                                <span className="block text-sm font-black">
                                    {option.label}
                                </span>
                                <span className={`mt-1 block text-[0.68rem] leading-4 ${isActive ? "text-white/85" : "text-black/40"}`}>
                                    {option.helper}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {modeMessage && (
                    <div className="mt-4 rounded-2xl border border-primarypurple/15 bg-primarypurple/[0.05] px-4 py-3 text-sm font-medium text-primarypurple">
                        {modeMessage}
                    </div>
                )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primarypurple">Curated feed</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Recommended projects</h2>
                </div>
                <p className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black/50 shadow-sm" role="status" aria-live="polite">
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
                    className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
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
