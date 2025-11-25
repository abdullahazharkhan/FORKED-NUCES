"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import ProjectDetails from "../../projects/components/ProjectDetails";

type ProjectPageProps = {
  params: Promise<{ projectid: string }>;
};

const RecommendedProject = ({ params }: ProjectPageProps) => {
  const { projectid } = React.use(params);
  const projectIdNumber = Number(projectid);

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", projectIdNumber],
    queryFn: async () => {
      const res = await authFetch(`/api/projects/${projectIdNumber}`, {
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
      {/* Loading skeleton reuse from main Project page if needed */}
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
        </div>
      )}

      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error)?.message || "Failed to load project."}
        </div>
      )}

      {!isLoading && !isError && project && <ProjectDetails project={project} />}
    </div>
  );
};

export default RecommendedProject;
