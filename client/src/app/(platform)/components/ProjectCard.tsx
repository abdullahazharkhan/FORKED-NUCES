"use client";

import Link from "next/link";
import { ArrowUpRight, CircleDot, Heart, SearchX } from "lucide-react";

export type ProjectSummary = {
    issues?: Array<{ status?: string }>;
    open_issues?: number;
    closed_issues?: number;
    likes_count?: number;
    owner_full_name?: string;
    owner_nu_email?: string;
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
            {isError && (
                <div
                    className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
                    role="alert"
                >
                    <div>
                        <p className="font-bold">Projects could not be loaded</p>
                        <p className="mt-1 text-red-700/80">
                            {(error as Error)?.message || "Please try again in a moment."}
                        </p>
                    </div>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={isRetrying}
                            className="min-h-10 shrink-0 rounded-xl border border-red-300 bg-white px-4 font-bold transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:opacity-60"
                        >
                            {isRetrying ? "Retrying..." : "Try again"}
                        </button>
                    )}
                </div>
            )}

            {isLoading && (
                <div
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                    role="status"
                    aria-label="Loading projects"
                >
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="min-h-[280px] animate-pulse rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm"
                        >
                            <div className="h-3 w-24 rounded-full bg-primarypurple/10" />
                            <div className="mt-6 h-7 w-3/4 rounded bg-black/10" />
                            <div className="mt-3 h-4 w-1/2 rounded bg-black/[0.06]" />
                            <div className="mt-7 flex gap-2">
                                <div className="h-7 w-20 rounded-full bg-primarypurple/10" />
                                <div className="h-7 w-16 rounded-full bg-primarypurple/10" />
                            </div>
                            <div className="mt-8 border-t border-black/[0.06] pt-5">
                                <div className="h-4 w-2/5 rounded bg-black/10" />
                                <div className="mt-2 h-3 w-3/5 rounded bg-black/[0.06]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showEmptyState && (
                <div className="rounded-3xl border border-dashed border-primarypurple/25 bg-white px-6 py-14 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/[0.08] text-primarypurple">
                        <SearchX className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-xl font-black tracking-tight">No projects match yet</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
                        Try a broader search, remove a filter, or check another recommendation mode.
                    </p>
                </div>
            )}

            {!isLoading && !isError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((project) => {
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

                        return (
                            <Link
                                key={project.project_id}
                                href={`${basePath}/${project.project_id}`}
                                className="group relative flex min-h-[285px] flex-col overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-6 shadow-[0_16px_45px_rgba(24,15,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-primarypurple/25 hover:shadow-[0_24px_60px_rgba(58,35,126,0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/20"
                            >
                                <span
                                    className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-primarygreen/35 blur-2xl transition-transform duration-500 group-hover:scale-150"
                                    aria-hidden="true"
                                />

                                <div className="relative flex items-start justify-between gap-4">
                                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primarypurple/70">
                                        Community project
                                    </p>
                                    <ArrowUpRight
                                        className="h-5 w-5 shrink-0 text-black/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primarypurple"
                                        aria-hidden="true"
                                    />
                                </div>

                                <h2 className="relative mt-4 text-xl font-black leading-tight tracking-[-0.025em] text-black transition-colors group-hover:text-primarypurple sm:text-2xl">
                                    {project.title}
                                </h2>
                                <p className="mt-2 text-xs font-medium text-black/40">
                                    {project.updated_at
                                        ? formatUpdatedDate(project.updated_at)
                                        : "Ready for collaboration"}
                                </p>

                                <div className="mt-5 flex min-h-7 flex-wrap gap-2">
                                    {visibleTags.map((tag) => (
                                        <span
                                            key={tag.tag}
                                            className="rounded-full bg-primarypurple/[0.08] px-2.5 py-1 text-[0.68rem] font-bold text-primarypurple"
                                        >
                                            {tag.tag}
                                        </span>
                                    ))}
                                    {tags.length > visibleTags.length && (
                                        <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[0.68rem] font-bold text-black/45">
                                            +{tags.length - visibleTags.length}
                                        </span>
                                    )}
                                    {tags.length === 0 && (
                                        <span className="text-xs font-medium text-black/35">No tags added</span>
                                    )}
                                </div>

                                <div className="mt-auto flex items-end justify-between gap-4 border-t border-black/[0.06] pt-5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-black text-primarygreen">
                                            {ownerName.charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-black/75">{ownerName}</p>
                                            <p className="truncate text-xs text-black/40">
                                                {project.owner_nu_email || "NUCES community"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2 text-xs font-bold">
                                        <span className="inline-flex items-center gap-1 text-amber-700" title={`${openIssueCount} open issues`}>
                                            <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
                                            {openIssueCount}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-primarypurple" title={`${closedIssueCount} closed issues`}>
                                            <span aria-hidden="true">✓</span>
                                            {closedIssueCount}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-rose-600" title={`${project.likes_count ?? 0} likes`}>
                                            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
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
