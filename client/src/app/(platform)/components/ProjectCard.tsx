"use client";

import Link from "next/link";
import { ArrowUpRight, Check, CircleDot, Heart, SearchX } from "lucide-react";

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
                    className="rounded-2xl border border-red-200/80 bg-white/90 p-5 text-sm text-red-800 shadow-[0_14px_35px_rgba(185,28,28,0.08)]"
                    role="alert"
                >
                    {(error as Error)?.message || "Projects could not be loaded. Please try again in a moment."}
                </div>
            )}

            {isLoading && (
                <div
                    className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-6"
                    role="status"
                    aria-label="Loading projects"
                >
                    {SKELETON_IDS.map((id, index) => {
                        const isWide = index % 4 === 0 || index % 4 === 3;
                        return (
                            <div
                                key={id}
                                className={`min-h-[19rem] animate-pulse rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_14px_38px_rgba(40,20,90,0.05)] sm:p-6 ${projectGridSpan(index)} ${isWide ? "xl:min-h-[21rem]" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-2.5 w-28 rounded-full bg-primarypurple/10" />
                                    <div className="h-9 w-9 rounded-xl bg-black/[0.05]" />
                                </div>
                                <div className={`mt-7 h-8 rounded-lg bg-black/10 ${isWide ? "w-3/5" : "w-4/5"}`} />
                                <div className="mt-3 h-3 w-32 rounded-full bg-black/[0.06]" />
                                <div className="mt-7 flex gap-2">
                                    <div className="h-6 w-20 rounded-full bg-primarypurple/10" />
                                    <div className="h-6 w-16 rounded-full bg-primarypurple/10" />
                                </div>
                                <div className="mt-8 rounded-2xl bg-black/[0.025] p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-black/10" />
                                        <div className="flex-1">
                                            <div className="h-3.5 w-2/5 rounded-full bg-black/10" />
                                            <div className="mt-2 h-2.5 w-3/5 rounded-full bg-black/[0.06]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showEmptyState && (
                <div className="grid gap-6 rounded-3xl border border-black/[0.07] bg-white/90 px-6 py-10 shadow-[0_18px_50px_rgba(40,20,90,0.06)] sm:grid-cols-[auto_1fr] sm:items-center sm:px-8 sm:py-12">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primarypurple/10 bg-primarypurple/[0.07] text-primarypurple shadow-[0_8px_20px_rgba(111,60,255,0.08)]">
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
                <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-6">
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
                                className={`group relative flex min-h-[19rem] flex-col overflow-hidden rounded-3xl border border-black/[0.07] bg-white/90 p-5 shadow-[0_16px_45px_rgba(40,20,90,0.07)] backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primarypurple/20 hover:shadow-[0_24px_60px_rgba(54,29,117,0.13)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primarypurple motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${projectGridSpan(index)} ${isWide ? "xl:min-h-[21rem]" : ""}`}
                            >
                                <span
                                    className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primarypurple/[0.05] blur-2xl transition-colors duration-300 group-hover:bg-primarypurple/[0.1]"
                                    aria-hidden="true"
                                />

                                <div className="relative flex items-center justify-between gap-4">
                                    <p className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-primarypurple">
                                        Build record / {String(index + 1).padStart(2, "0")}
                                    </p>
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-black/[0.025] text-black/35 transition-[transform,border-color,background-color,color] group-hover:-translate-y-0.5 group-hover:border-primarypurple/15 group-hover:bg-primarypurple/[0.07] group-hover:text-primarypurple">
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

                                <div className="mt-auto flex flex-col gap-5 rounded-2xl bg-[linear-gradient(135deg,rgba(111,60,255,0.045),rgba(23,19,31,0.018))] p-4 sm:flex-row sm:items-end sm:justify-between">
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
                                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
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
