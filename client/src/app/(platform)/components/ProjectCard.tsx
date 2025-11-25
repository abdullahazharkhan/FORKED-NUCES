"use client";

import React from 'react'
import Link from 'next/link'
import { Heart } from "lucide-react";   // <-- NEW

type ProjectCardProps = {
    isError: boolean
    error: unknown
    isLoading: boolean
    showEmptyState: boolean
    filteredProjects: any[]
    basePath?: string
}

const ProjectCard = ({ isError, error, isLoading, showEmptyState, filteredProjects, basePath = "/platform/projects" }: ProjectCardProps
) => {

    return (
        <div>
            {isError && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {(error as Error)?.message || "Failed to load projects."}
                </div>
            )}

            {/* Skeleton Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                            key={idx}
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

            {/* Empty state */}
            {showEmptyState && (
                <p className="text-sm text-gray-600">
                    No projects found.
                </p>
            )}

            {/* Projects Grid */}
            {!isLoading && !isError && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project: any) => (
                        <Link
                            key={project.project_id}
                            href={`${basePath}/${project.project_id}`}
                            className="flex flex-col rounded border border-primarypurple/20 bg-primarypurple/5 p-4 transition-all duration-200 hover:border-primarypurple/60 hover:bg-primarypurple/10 min-h-[200px]"
                        >
                            {/* Title */}
                            <h3 className="text-xl font-semibold">{project.title}</h3>

                            {/* Updated date */}
                            <p className="text-sm text-gray-600">
                                Updated on {new Date(project.updated_at).toLocaleDateString()}
                            </p>

                            {/* Tags + Likes */}
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tagObj: any) => (
                                        <span
                                            key={tagObj.tag}
                                            className="rounded bg-primarypurple/20 px-2 py-1 text-xs text-primarypurple"
                                        >
                                            {tagObj.tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Likes */}
                                <div className="flex items-center gap-1 text-primarypurple text-sm font-semibold">
                                    <Heart size={16} className="fill-primarypurple/20" />
                                    {project.likes_count ?? 0}
                                </div>
                            </div>

                            {/* Owner + Issues Count */}
                            <div className="mt-auto pt-3 flex items-start justify-between border-t border-primarypurple/20">
                                <div className="text-sm text-gray-700">
                                    <p className="font-semibold">{project.owner_full_name}</p>
                                    <p className="text-gray-600">{project.owner_nu_email}</p>
                                </div>

                                <div className="text-right text-sm">
                                    <p className="font-semibold text-primarypurple">
                                        Open:{" "}
                                        {
                                            project.issues.filter((issue: any) => issue.status === "open")
                                                .length
                                        }
                                    </p>

                                    <p className="text-gray-700">
                                        Closed:{" "}
                                        {
                                            project.issues.filter((issue: any) => issue.status === "closed")
                                                .length
                                        }
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ProjectCard;
