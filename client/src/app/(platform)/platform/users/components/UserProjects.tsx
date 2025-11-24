import ProjectCard from '@/app/(platform)/components/ProjectCard'
import React, { useMemo, useState } from 'react'
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

const UserProjects = ({ userid }: { userid: string }) => {
    const [search, setSearch] = useState("");
    const [selectedTag, setSelectedTag] = useState("all");

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["my-projects"],
        queryFn: async () => {
            const res = await authFetch(`/api/projects/by-user/${userid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch your projects");
            }

            return res.json();
        },
    });

    const projects = Array.isArray(data) ? data : [];

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        projects.forEach((project: any) => {
            project.tags?.forEach((t: any) => tags.add(t.tag));
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
                project.tags?.some((t: any) => t.tag === selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [search, selectedTag, projects]);

    const showEmptyState =
        !isLoading && !isError && filteredProjects.length === 0;

    return (
        <div className="my-6 space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
            <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                Projects Owned
            </h1>

            <ProjectCard
                isError={isError}
                error={error}
                isLoading={isLoading}
                showEmptyState={showEmptyState}
                filteredProjects={filteredProjects}
            />
        </div>
    )
}

export default UserProjects