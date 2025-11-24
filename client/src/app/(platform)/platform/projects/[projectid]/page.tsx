"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import ProjectDetails from "../components/ProjectDetails";

const Project = ({ params }: { params: Promise<{ projectid: string }> }) => {
    const { projectid } = React.use(params);

    const {
        data: project,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["project", projectid],
        queryFn: async () => {
            const res = await authFetch(`/api/projects/${projectid}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch project");
            }

            return res.json();
        },
    });

    return (
        <div className="space-y-6 px-8 py-6">
            {/* Loading skeleton */}
            {isLoading && (
                <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
                    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
                        <div className="mb-2 h-7 w-2/3 rounded bg-gray-300" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                        <div className="mt-4 h-5 w-1/3 rounded bg-gray-300" />
                        <div className="h-32 w-full rounded bg-gray-100" />
                    </div>
                    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
                        <div className="h-5 w-1/4 rounded bg-gray-300" />
                        <div className="h-20 w-full rounded bg-gray-100" />
                        <div className="h-20 w-full rounded bg-gray-100" />
                    </div>
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {(error as Error)?.message || "Failed to load project."}
                </div>
            )}

            {/* Content */}
            {!isLoading && !isError && project && (
                <ProjectDetails project={project} />
            )}
        </div>
    );
};

export default Project;
