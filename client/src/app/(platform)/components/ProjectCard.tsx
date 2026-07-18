"use client";

import Link from "next/link";
import { ArrowUpRight, CircleDot, Heart, SearchX } from "lucide-react";

import { RetryAlert } from "./RetryAlert";
import { UserAvatar } from "./UserAvatar";

export type ProjectSummary = {
    issues?: Array<{ status?: string }>;
    open_issues?: number;
    closed_issues?: number;
    likes_count?: number;
    owner_full_name?: string;
    owner_nu_email?: string;
    owner_avatar_url?: string | null;
    project_id: number;
    tags?: Array<{ tag: string }>;
    title: string;
    updated_at?: string;
};

type ProjectCardProps = {
    basePath?: string;
    error: unknown;
    filteredProjects: ProjectSummary[];
    isError: boolean;
    isLoading: boolean;
    isRetrying?: boolean;
    onRetry?: () => void;
    showEmptyState: boolean;
};

const SKELETON_IDS = ["one", "two", "three", "four", "five", "six"] as const;

function projectGridSpan(index: number) {
    return index % 4 === 0 || index % 4 === 3
        ? "xl:col-span-7"
        : "xl:col-span-5";
}

function formatUpdatedDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently updated";
    return `Updated ${date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    })}`;
}

const ProjectCard = ({
    basePath = "/platform/projects",
    error,
    filteredProjects,
    isError,
    isLoading,
    isRetrying = false,
    onRetry,
    showEmptyState,
}: ProjectCardProps) => {
    return (
        <div>
            {isError && onRetry && (
                <RetryAlert
                    error={error}
                    fallbackMessage="Projects could not be loaded. Please try again in a moment."
                    isRetrying={isRetrying}
                    onRetry={onRetry}
                />
            )}

            {isError && !onRetry && (
                <div
                    className="border-y border-r border-red-200 border-l-4 border-l-red-600 bg-white p-5 text-sm text-red-800"
                    role="alert"
                >
                    {(error as Error)?.message || "Projects could not be loaded. Please try again in a moment."}
                </div>
            )}

            {isLoading && (
                <div
                    className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-12"
                    role="status"
                    aria-label="Loading projects"
                >
                    {SKELETON_IDS.map((id, index) => {
                        const isWide = index % 4 === 0 || index % 4 === 3;
                        return (
                            <div
                                key={id}
                                className={`min-h-[19rem] animate-pulse border border-t-2 border-black/10 bg-white p-5 sm:p-6 ${projectGridSpan(index)} ${isWide ? "xl:min-h-[21rem]" : ""}`}
                            >
                                <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
                                    <div className="h-2.5 w-28 rounded-sm bg-primarypurple/10" />
                                    <div className="h-8 w-8 rounded-sm bg-black/[0.06]" />
                                </div>
                                <div className={`mt-7 h-8 rounded-sm bg-black/10 ${isWide ? "w-3/5" : "w-4/5"}`} />
                                <div className="mt-3 h-3 w-32 rounded-sm bg-black/[0.06]" />
                                <div className="mt-7 flex gap-2">
                                    <div className="h-6 w-20 rounded-full bg-primarypurple/10" />
                                    <div className="h-6 w-16 rounded-full bg-primarypurple/10" />
                                </div>
                                <div className="mt-8 border-t border-black/[0.08] pt-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-black/10" />
                                        <div className="flex-1">
                                            <div className="h-3.5 w-2/5 rounded-sm bg-black/10" />
                                            <div className="mt-2 h-2.5 w-3/5 rounded-sm bg-black/[0.06]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showEmptyState && (
                <div className="grid gap-6 border-y border-black/15 bg-white px-6 py-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-8 sm:py-12">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md border border-primarypurple/20 bg-primarypurple/[0.07] text-primarypurple">
                        <SearchX className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primarypurple">Directory note / no matches</p>
                        <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">No projects match yet</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-black/60">
                            Try a broader search, remove a filter, or check another recommendation mode.
                        </p>
                    </div>
                </div>
            )}

            {!isLoading && !isError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-12">
                    {filteredProjects.map((project, index) => {
                        const issues = project.issues ?? [];
                        const openIssueCount =
                            project.open_issues ??
                            issues.filter((issue) => issue.status === "open").length;
                        const closedIssueCount =
                            project.closed_issues ??
                            issues.filter((issue) => issue.status === "closed").length;
                        const tags = project.tags ?? [];
                        const visibleTags = tags.slice(0, 3);
                        const ownerName = project.owner_full_name || "FASTian contributor";
                        const isWide = index % 4 === 0 || index % 4 === 3;

                        return (
                            <Link
                                key={project.project_id}
                                href={`${basePath}/${project.project_id}`}
                                className={`group relative flex min-h-[19rem] flex-col overflow-hidden border border-t-2 border-black/15 bg-white p-5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primarypurple/45 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primarypurple sm:p-6 ${projectGridSpan(index)} ${isWide ? "xl:min-h-[21rem]" : ""}`}
                            >
                                <span
                                    className="absolute left-0 top-0 h-1 w-12 origin-left scale-x-0 bg-primarygreen transition-transform duration-200 group-hover:scale-x-100"
                                    aria-hidden="true"
                                />

                                <div className="relative flex items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
                                    <p className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-primarypurple">
                                        Build record / {String(index + 1).padStart(2, "0")}
                                    </p>
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-black/10 text-black/35 transition-colors group-hover:border-primarypurple/30 group-hover:text-primarypurple">
                                        <ArrowUpRight
                                            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </div>

                                <h2 className={`relative mt-7 text-balance font-black leading-[1.03] tracking-[-0.04em] text-black transition-colors group-hover:text-primarypurple ${isWide ? "text-2xl sm:text-3xl" : "text-2xl"}`}>
                                    {project.title}
                                </h2>
                                <p className="mt-3 font-mono text-[0.65rem] tabular-nums text-black/60">
                                    {project.updated_at
                                        ? formatUpdatedDate(project.updated_at)
                                        : "Ready for collaboration"}
                                </p>

                                <div className="mt-5 flex min-h-7 flex-wrap gap-2">
                                    {visibleTags.map((tag) => (
                                        <span
                                            key={tag.tag}
                                            className="rounded-full border border-primarypurple/10 bg-primarypurple/[0.07] px-2.5 py-1 text-[0.68rem] font-bold text-primarypurple"
                                        >
                                            {tag.tag}
                                        </span>
                                    ))}
                                    {tags.length > visibleTags.length && (
                                        <span className="rounded-full border border-black/[0.06] bg-black/[0.04] px-2.5 py-1 text-[0.68rem] font-bold text-black/60">
                                            +{tags.length - visibleTags.length}
                                        </span>
                                    )}
                                    {tags.length === 0 && (
                                        <span className="text-xs font-medium text-black/60">No tags added</span>
                                    )}
                                </div>

                                <div className="mt-auto flex flex-col gap-5 border-t border-black/[0.08] pt-5 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <UserAvatar
                                            avatarUrl={project.owner_avatar_url ?? null}
                                            name={ownerName}
                                            size="sm"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black/75">{ownerName}</p>
                                            <p className="truncate text-xs text-black/60">
                                                {project.owner_nu_email || "NUCES community"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3 font-mono text-[0.68rem] font-semibold tabular-nums text-black/60">
                                        <span className="inline-flex items-center gap-1" aria-label={`${openIssueCount} open issues`} title={`${openIssueCount} open issues`}>
                                            <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
                                            {openIssueCount}
                                        </span>
                                        <span className="inline-flex items-center gap-1" aria-label={`${closedIssueCount} closed issues`} title={`${closedIssueCount} closed issues`}>
                                            <span aria-hidden="true">✓</span>
                                            {closedIssueCount}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-primarypurple" aria-label={`${project.likes_count ?? 0} likes`} title={`${project.likes_count ?? 0} likes`}>
                                            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                                            {project.likes_count ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectCard;
