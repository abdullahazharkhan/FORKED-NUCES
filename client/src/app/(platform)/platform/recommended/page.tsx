"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import ProjectCard from "../../components/ProjectCard";
import { useAuthStore } from "@/stores";

type RecommendationResult = {
  list: any[];
  message?: string;
};

const RecommendedProjects = () => {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [recommendationMode, setRecommendationMode] = useState("spotlight");

  const loggedInUser = useAuthStore((state) => state.user);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommended-projects"],
    queryFn: async () => {
      const res = await authFetch("/api/projects/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recommended projects");
      }

      return res.json();
    },
  });

  const projects = Array.isArray(data) ? data : [];

  const userSkillSet = useMemo(() => {
    if (!loggedInUser?.skills) return new Set<string>();
    return new Set(
      loggedInUser.skills
        .filter(Boolean)
        .map((skill) => skill.toLowerCase().trim())
    );
  }, [loggedInUser]);

  const getSkillScore = (project: any) => {
    if (!Array.isArray(project.tags) || userSkillSet.size === 0) return 0;
    return project.tags.reduce((score: number, tagObj: any) => {
      const tag = (tagObj?.tag || "").toLowerCase().trim();
      return userSkillSet.has(tag) ? score + 1 : score;
    }, 0);
  };

  const getOpenIssueCount = (project: any) => {
    if (!Array.isArray(project.issues)) return 0;
    return project.issues.filter((issue: any) =>
      (issue.status || "").toLowerCase() === "open"
    ).length;
  };

  const getEngagementScore = (project: any) => {
    const likes = Number(project.likes_count ?? 0);
    const comments = Number(
      project.comments_count ?? project.comment_count ?? 0
    );
    return likes + comments;
  };

  const getFreshnessScore = (project: any) => {
    const updated = new Date(project.updated_at || project.created_at || 0).getTime();
    const ageInDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 30 - ageInDays); // bias toward last 30 days
    return freshness + getEngagementScore(project);
  };

  const isNetworkProject = (project: any) => {
    if (!loggedInUser) return false;
    if (project.user_has_liked || project.user_has_commented) return true;
    if (project.user_has_collaborated) return true;

    const collaborators = Array.isArray(project.collaborators)
      ? project.collaborators
      : Array.isArray(project.collaborator_details)
        ? project.collaborator_details
        : [];
    if (
      collaborators.some(
        (collab: any) =>
          collab?.user_id === loggedInUser.user_id ||
          collab?.nu_email === loggedInUser.nu_email
      )
    ) {
      return true;
    }

    const interactions = Array.isArray(project.interactions)
      ? project.interactions
      : [];
    if (
      interactions.some(
        (interaction: any) =>
          interaction?.user_id === loggedInUser.user_id ||
          ["like", "liked", "comment", "commented", "collaborated"].includes(
            (interaction?.type || interaction?.action || "")
              .toString()
              .toLowerCase()
          )
      )
    ) {
      return true;
    }

    return false;
  };

  const applyRecommendationMode = (projectsList: any[]): RecommendationResult => {
    switch (recommendationMode) {
      case "best-skill": {
        if (userSkillSet.size === 0) {
          return {
            list: [],
            message:
              "You haven't added any skills yet. Update your profile skills to unlock tailored matches.",
          };
        }
        const scored = projectsList
          .map((project) => ({ project, score: getSkillScore(project) }))
          .sort((a, b) => b.score - a.score);
        const withScore = scored.filter(({ score }) => score > 0);
        if (withScore.length === 0) {
          return {
            list: [],
            message:
              "None of the current projects match your listed skills yet. Try updating your stack or explore other modes.",
          };
        }
        return { list: withScore.map(({ project }) => project) };
      }
      case "with-issues":
        return {
          list: projectsList.filter((project) => getOpenIssueCount(project) > 0),
        };
      case "without-issues":
        return {
          list: projectsList.filter((project) => getOpenIssueCount(project) === 0),
        };
      case "spotlight":
        return {
          list: [...projectsList].sort(
            (a, b) => getFreshnessScore(b) - getFreshnessScore(a)
          ),
        };
      case "network": {
        if (!loggedInUser) {
          return {
            list: [],
            message:
              "Sign in to see projects you've liked, commented on, or collaborated with across FORK'd.",
          };
        }
        const inNetwork = projectsList.filter((project) =>
          isNetworkProject(project)
        );
        if (inNetwork.length === 0) {
          return {
            list: [],
            message:
              "We couldn't find any projects you've liked, commented on, or collaborated with yet. Engage with a project to start shaping this feed.",
          };
        }
        return { list: inNetwork };
      }
      default:
        return { list: projectsList };
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((project: any) => {
      project.tags.forEach((t: any) => tags.add(t.tag));
    });
    return ["all", ...Array.from(tags)];
  }, [projects]);

  const recommendationOutcome = useMemo<RecommendationResult>(() => {
    const q = search.trim().toLowerCase();

    const base = projects.filter((project: any) => {
      const matchesSearch =
        project.title.toLowerCase().includes(q) ||
        project.owner_full_name.toLowerCase().includes(q) ||
        project.owner_nu_email.toLowerCase().includes(q);

      const matchesTag =
        selectedTag === "all" ||
        project.tags.some((t: any) => t.tag === selectedTag);

      return matchesSearch && matchesTag;
    });

    return applyRecommendationMode(base);
  }, [
    search,
    selectedTag,
    projects,
    recommendationMode,
    userSkillSet,
    loggedInUser,
  ]);

  const filteredProjects = recommendationOutcome.list;
  const modeMessage = recommendationOutcome.message;

  const showEmptyState =
    !isLoading && !isError && filteredProjects.length === 0;

  const recommendationOptions = [
    {
      id: "spotlight",
      label: "Spotlight",
      helper: "Fresh & noteworthy picks",
    },
    { id: "best-skill", label: "Skill Match", helper: "Matches your skills" },
    { id: "with-issues", label: "Open Issues", helper: "Needs contributors" },
    {
      id: "without-issues",
      label: "Resolved & Stable",
      helper: "No open issues",
    },
    {
      id: "network",
      label: "From Your Network",
      helper: "You interacted with",
    },
  ];

  return (
    <div className="p-6 px-8 space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
          Recommended FORK'd Projects
        </h1>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search recommended projects..."
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

      {/* Recommendation Modes */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Recommendation Mode
        </p>
        <div className="flex flex-wrap gap-2">
          {recommendationOptions.map((option) => {
            const isActive = recommendationMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRecommendationMode(option.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primarypurple/40 ${
                  isActive
                    ? "border-primarypurple bg-primarypurple text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-primarypurple/60"
                }`}
                title={option.helper}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="ml-1 hidden text-xs text-white/80 sm:inline">
                  {isActive ? `· ${option.helper}` : ""}
                </span>
              </button>
            );
          })}
        </div>
        {modeMessage && (
          <div className="rounded-lg border border-primarypurple/20 bg-primarypurple/5 px-4 py-2 text-sm text-primarypurple">
            {modeMessage}
          </div>
        )}
      </div>

      {/* Project Cards */}
      <ProjectCard
        isError={isError}
        error={error}
        isLoading={isLoading}
        showEmptyState={showEmptyState}
        filteredProjects={filteredProjects}
        basePath="/platform/recommended"
      />
    </div>
  );
};

export default RecommendedProjects;
