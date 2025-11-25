"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";

type Collaborator = {
    user_id: number;
    full_name: string;
    nu_email: string;
    avatar_url?: string | null;
};

const ProjectCollaboratorsSkeleton: React.FC = () => {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-primarypurple/10 bg-white/70 px-3 py-2 animate-pulse"
                >
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex flex-col gap-1">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                        <div className="h-3 w-40 rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProjectCollaborators = ({ projectid }: { projectid: number }) => {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["project-collaborators", projectid],
        queryFn: async () => {
            const res = await authFetch(
                `/api/projects/${projectid}/collaborators`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch collaborators");
            }

            const body = await res.json();
            return Array.isArray(body) ? body : [];
        },
    });

    const collaborators: Collaborator[] = data || [];

    return (
        <div className="space-y-3 border-t border-primarypurple/20 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Collaborators</h2>
                    <p className="text-xs text-gray-600">
                        Users who have collaborated on issues for this project.
                    </p>
                </div>
            </div>

            {/* Skeleton Loader */}
            {isLoading && <ProjectCollaboratorsSkeleton />}

            {/* Error */}
            {isError && !isLoading && (
                <p className="text-sm text-red-600">
                    {(error as Error)?.message ||
                        "Failed to load collaborators."}
                </p>
            )}

            {/* Empty state */}
            {!isLoading && !isError && collaborators.length === 0 && (
                <p className="text-sm text-gray-600">
                    No collaborators have been added for this project yet.
                </p>
            )}

            {/* Collaborators list */}
            {!isLoading && !isError && collaborators.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {collaborators.map((collab) => (
                        <Link
                            href={`/platform/users/${collab.user_id}`}
                            key={collab.user_id}
                            className="flex items-center gap-3 rounded-lg border border-primarypurple/10 bg-white/80 px-3 py-2"
                        >
                            {/* Avatar */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primarypurple/10 text-xs font-semibold text-primarypurple">
                                {collab.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={collab.avatar_url}
                                        alt={collab.full_name}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                ) : (
                                    (collab.full_name || collab.nu_email || "?")
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-gray-900">
                                    {collab.full_name || "Unnamed User"}
                                </span>
                                <span className="truncate text-xs text-gray-600">
                                    {collab.nu_email}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectCollaborators;
