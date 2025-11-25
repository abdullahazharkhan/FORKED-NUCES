"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";

type Project = {
    project_id: number;
    title: string;
    owner_full_name: string;
    owner_nu_email: string;
};

const ProjectsSkeleton: React.FC = () => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={idx}
                    className="rounded-xl border border-primarypurple/10 bg-white/80 p-4 shadow-sm animate-pulse space-y-3"
                >
                    <div className="h-5 w-2/3 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                </div>
            ))}
        </div>
    );
};

const UserCollaborations = ({ userid }: { userid: string }) => {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["user-collaborated-projects", userid],
        queryFn: async () => {
            const res = await authFetch(
                `/api/users/${userid}/collaborated-projects`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch collaborated projects");
            }
            return res.json();
        },
    });

    const projects: Project[] = Array.isArray(data) ? data : [];

    return (
        <div className="my-6 space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
            {/* Heading */}
            <h1 className="text-3xl font-semibold underline decoration-4 decoration-primarypurple">
                Collaborated Projects
            </h1>

            {/* Loader */}
            {isLoading && <ProjectsSkeleton />}

            {/* Error */}
            {isError && (
                <p className="text-sm text-red-600">
                    {(error as Error)?.message ||
                        "Failed to load collaborated projects."}
                </p>
            )}

            {/* Empty state */}
            {!isLoading && !isError && projects.length === 0 && (
                <p className="text-sm text-gray-600">
                    No collaborated projects found.
                </p>
            )}

            {/* Project Cards */}
            {!isLoading && !isError && projects.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            href={`/platform/projects/${project.project_id}`}
                            key={project.project_id}
                            className="rounded-xl border border-primarypurple/10 bg-white/80 p-4 shadow-sm flex flex-col gap-2"
                        >
                            <h2 className="text-base font-semibold text-gray-900">
                                {project.title}
                            </h2>

                            <p className="text-xs text-gray-700">
                                by{" "}
                                <span className="font-medium">
                                    {project.owner_full_name}
                                </span>
                                <br />
                                <div
                                    className="text-primarypurple underline"
                                >
                                    {project.owner_nu_email}
                                </div>
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserCollaborations;
