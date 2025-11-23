"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

const Platform = () => {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await authFetch("/api/projects/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }

      return res.json();
    },
  });

  const projects = Array.isArray(data) ? data : [];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((project: any) => {
      project.tags.forEach((t: any) => tags.add(t.tag));
    });
    return ["all", ...Array.from(tags)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    return projects.filter((project: any) => {
      const matchesSearch =
        project.title.toLowerCase().includes(q) ||
        project.owner_full_name.toLowerCase().includes(q) ||
        project.owner_nu_email.toLowerCase().includes(q);

      const matchesTag =
        selectedTag === "all" ||
        project.tags.some((t: any) => t.tag === selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [search, selectedTag, projects]);

  const showEmptyState =
    !isLoading && !isError && filteredProjects.length === 0;

  return (
    <div className="p-6 px-8 space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
          Explore FORK'd Projects
        </h1>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by title or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
          />

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full max-w-xs rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
          >
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Tags" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
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
          No projects found matching your criteria.
        </p>
      )}

      {/* Projects Grid */}
      {!isLoading && !isError && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: any) => (
            <Link
              key={project.project_id}
              href={`/platform/projects/${project.project_id}`}
              className="flex flex-col rounded border border-primarypurple/20 bg-primarypurple/5 p-4 transition-all duration-200 hover:border-primarypurple/60 hover:bg-primarypurple/10 min-h-[180px]"
            >
              {/* Title */}
              <h3 className="text-xl font-semibold">{project.title}</h3>

              {/* Updated date */}
              <p className="text-sm text-gray-600">
                Updated on {new Date(project.updated_at).toLocaleDateString()}
              </p>

              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-2">
                {project.tags.map((tagObj: any) => (
                  <span
                    key={tagObj.tag}
                    className="rounded bg-primarypurple/20 px-2 py-1 text-xs text-primarypurple"
                  >
                    {tagObj.tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 text-sm text-gray-700 border-t border-primarypurple/20">
                <p className="font-semibold">{project.owner_full_name}</p>
                <p className="text-gray-600">{project.owner_nu_email}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Platform;
