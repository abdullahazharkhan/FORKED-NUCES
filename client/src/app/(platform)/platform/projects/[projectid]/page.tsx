"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import ProjectDetails from "../components/ProjectDetails";
import { queryKeys } from "@/lib/queryKeys";
import { HttpResponseError, isNotFoundError } from "@/lib/httpError";
import { RetryAlert } from "@/app/(platform)/components/RetryAlert";

type ProjectPageProps = {
    params: Promise<{ projectid: string }>;
};

const ISSUE_SKELETON_IDS = ["one", "two", "three"] as const;

const Project = ({ params }: ProjectPageProps) => {
    const { projectid } = React.use(params);

    const projectIdNumber = Number(projectid);
    const hasValidProjectId =
        Number.isSafeInteger(projectIdNumber) && projectIdNumber > 0;

    const {
        data: project,
        isLoading,
        isError,
        isFetching,
        error,
        refetch,
    } = useQuery({
        queryKey: queryKeys.project(projectIdNumber),
        queryFn: async ({ signal }) => {
            const res = await authFetch(`/api/projects/${projectIdNumber}`, {
                method: "GET",
                signal,
            });

            if (!res.ok) {
                throw new HttpResponseError(
                    "Failed to fetch project",
                    res.status
                );
            }

            return res.json();
        },
        enabled: hasValidProjectId,
        retry: (failureCount, queryError) =>
            !isNotFoundError(queryError) && failureCount < 3,
    });

    if (!hasValidProjectId || isNotFoundError(error)) notFound();

    return (
        <div className="space-y-6 px-8 py-6">
            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6 animate-pulse">
                    <div className="space-y-3">
                        <div className="h-7 w-2/3 rounded bg-gray-300" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                        <div className="flex flex-wrap gap-3">
                            <div className="h-3 w-24 rounded bg-gray-200" />
                            <div className="h-3 w-28 rounded bg-gray-200" />
                            <div className="h-3 w-32 rounded bg-gray-200" />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-primarypurple/15 py-3">
                        <div className="flex flex-wrap gap-2">
                            <div className="h-5 w-14 rounded-full bg-gray-200" />
                            <div className="h-5 w-16 rounded-full bg-gray-200" />
                            <div className="h-5 w-20 rounded-full bg-gray-200" />
                        </div>
                        <div className="h-4 w-40 rounded bg-gray-200" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-5 w-24 rounded bg-gray-300" />
                        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                            <div className="h-4 w-full rounded bg-gray-100" />
                            <div className="h-4 w-5/6 rounded bg-gray-100" />
                            <div className="h-4 w-4/6 rounded bg-gray-100" />
                            <div className="h-4 w-3/6 rounded bg-gray-100" />
                        </div>
                    </div>
                    <div className="space-y-3 border-t border-primarypurple/20 pt-4">
                        <div className="flex items-baseline justify-between">
                            <div className="h-5 w-20 rounded bg-gray-300" />
                            <div className="flex gap-3">
                                <div className="h-3 w-16 rounded bg-gray-200" />
                                <div className="h-3 w-16 rounded bg-gray-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            {ISSUE_SKELETON_IDS.map((id) => (
                                <div
                                    key={id}
                                    className="rounded-xl border border-primarypurple/20 bg-white/80 shadow-sm"
                                >
                                    <div className="flex w-full items-center justify-between gap-2 px-3 py-2">
                                        <div className="space-y-1">
                                            <div className="h-4 w-40 rounded bg-gray-200" />
                                            <div className="h-3 w-24 rounded bg-gray-100" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-14 rounded-full bg-gray-200" />
                                            <div className="h-3 w-3 rounded bg-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {isError && (
                <RetryAlert
                    error={error}
                    fallbackMessage="Failed to load project."
                    isRetrying={isFetching}
                    onRetry={() => void refetch()}
                />
            )}

            {/* Content */}
            {!isLoading && project && <ProjectDetails project={project} />}
        </div>
    );
};

export default Project;
