"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

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
        <div className="p-6 px-8 space-y-6">
            <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                Project Details
            </h1>

            {isLoading && (
                <div className="rounded border border-gray-200 bg-gray-100 p-4 animate-pulse">
                    <div className="h-6 w-1/2 bg-gray-300 rounded mb-3"></div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                </div>
            )}

            {isError && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {(error as Error)?.message || "Failed to load project."}
                </div>
            )}

            {!isLoading && !isError && project && (
                <div className="rounded-xl border border-primarypurple/30 bg-primarypurple/5 p-6 space-y-4">
                    <h2 className="text-3xl font-bold">{project.title}</h2>

                    <p className="text-gray-600">
                        Updated on {new Date(project.updated_at).toLocaleDateString()}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {project.tags?.map((t: any) => (
                            <span
                                key={t.tag}
                                className="rounded bg-primarypurple/20 px-3 py-1 text-xs text-primarypurple"
                            >
                                {t.tag}
                            </span>
                        ))}
                    </div>

                    <div className="border-t border-primarypurple/30 pt-4 text-sm">
                        <p className="font-semibold text-gray-700">
                            {project.owner_full_name}
                        </p>
                        <p className="text-gray-600">{project.owner_nu_email}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Project;
