"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import ProjectDetails from "../../projects/components/ProjectDetails";
import { queryKeys } from "@/lib/queryKeys";
import { HttpResponseError, isNotFoundError } from "@/lib/httpError";
import { RetryAlert } from "@/app/(platform)/components/RetryAlert";
import ProjectDetailsSkeleton from "../../projects/components/ProjectDetailsSkeleton";

type ProjectPageProps = {
  params: Promise<{ projectid: string }>;
};

const RecommendedProject = ({ params }: ProjectPageProps) => {
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
        throw new HttpResponseError("Failed to fetch project", res.status);
      }

      return res.json();
    },
    enabled: hasValidProjectId,
    retry: (failureCount, queryError) =>
      !isNotFoundError(queryError) && failureCount < 3,
  });

  if (!hasValidProjectId || isNotFoundError(error)) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {isLoading && <ProjectDetailsSkeleton />}

      {isError && (
        <RetryAlert
          error={error}
          fallbackMessage="Failed to load project."
          isRetrying={isFetching}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && project && <ProjectDetails project={project} />}
    </div>
  );
};

export default RecommendedProject;
