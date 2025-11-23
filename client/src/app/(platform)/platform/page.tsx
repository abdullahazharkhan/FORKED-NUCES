"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import ProjectCard from "../components/ProjectCard";

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
            placeholder="Search projects..."
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

      {/* Project Cards */}
      <ProjectCard
        isError={isError}
        error={error}
        isLoading={isLoading}
        showEmptyState={showEmptyState}
        filteredProjects={filteredProjects}
      />
    </div>
  );
};

export default Platform;
