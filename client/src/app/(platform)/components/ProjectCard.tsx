"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

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
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>
                        {(error as Error)?.message || "Failed to load projects."}
                    </span>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={isRetrying}
                            className="rounded border border-red-300 bg-white px-3 py-1 font-semibold hover:bg-red-100 disabled:opacity-60"
                        >
                            {isRetrying ? "Retrying..." : "Try again"}
                        </button>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="flex flex-col gap-3 rounded border border-primarypurple/10 bg-primarypurple/5 p-4"
                        >
                            <div className="h-6 w-2/3 animate-pulse rounded bg-gray-300" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                            <div className="flex gap-2">
                                <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                                <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                            </div>
                            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-300" />
                        </div>
                    ))}
                </div>
            )}

            {showEmptyState && (
                <p className="text-sm text-gray-600">No projects found.</p>
            )}

            {!isLoading && !isError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => {
                        const issues = project.issues ?? [];
                        const openIssueCount =
                            project.open_issues ??
                            issues.filter((issue) => issue.status === "open").length;
                        const closedIssueCount =
                            project.closed_issues ??
                            issues.filter((issue) => issue.status === "closed").length;
                        const tags = project.tags ?? [];
                        return (
                            <Link
                                key={project.project_id}
                                href={`${basePath}/${project.project_id}`}
                                className="flex min-h-[200px] flex-col rounded border border-primarypurple/20 bg-primarypurple/5 p-4 transition-all duration-200 hover:border-primarypurple/60 hover:bg-primarypurple/10"
                            >
                                <h3 className="text-xl font-semibold">
                                    {project.title}
                                </h3>

                                {project.updated_at && (
                                    <p className="text-sm text-gray-600">
                                        Updated on{" "}
                                        {new Date(
                                            project.updated_at
                                        ).toLocaleDateString()}
                                    </p>
                                )}

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag.tag}
                                                className="rounded bg-primarypurple/20 px-2 py-1 text-xs text-primarypurple"
                                            >
                                                {tag.tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 text-sm font-semibold text-primarypurple">
                                        <Heart
                                            size={16}
                                            className="fill-primarypurple/20"
                                            aria-hidden="true"
                                        />
                                        {project.likes_count ?? 0}
                                    </div>
                                </div>

                                <div className="mt-auto flex items-start justify-between border-t border-primarypurple/20 pt-3">
                                    <div className="text-sm text-gray-700">
                                        <p className="font-semibold">
                                            {project.owner_full_name}
                                        </p>
                                        <p className="text-gray-600">
                                            {project.owner_nu_email}
                                        </p>
                                    </div>

                                    <div className="text-right text-sm">
                                        <p className="font-semibold text-primarypurple">
                                            Open:{" "}
                                            {openIssueCount}
                                        </p>
                                        <p className="text-gray-700">
                                            Closed:{" "}
                                            {closedIssueCount}
                                        </p>
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
