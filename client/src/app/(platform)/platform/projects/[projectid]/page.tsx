"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import EditProjectForm from "../../../components/EditProjectForm";


const ProjectDetails = ({ project }: { project: any }) => {
    const issues = Array.isArray(project.issues) ? project.issues : [];

    // NOTE: adjust status comparison to your actual backend values
    const openIssues = issues.filter((i: any) => i.status === "open" || i.status === "OPEN");
    const closedIssues = issues.filter((i: any) => i.status === "closed" || i.status === "CLOSED");

    const loggedInUser = useAuthStore((s) => s.user);
    const isOwner = loggedInUser?.nu_email === project.owner_nu_email;

    const [isEditOpen, setIsEditOpen] = React.useState(false);

    const handleDelete = () => {
        console.log("Delete project", project.project_id);
        // TODO: wire this up with a DELETE /api/projects/:id via authFetch + mutation
    };

    return (
        <>
            <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] my-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
                {/* LEFT: Project + author + description */}
                <div className="relative space-y-4">
                    {isOwner && (
                        <div className="absolute right-0 -top-2 flex gap-2">
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="rounded-lg border border-primarypurple/30 bg-primarypurple/20 px-3 py-1 text-sm font-semibold text-primarypurple transition hover:bg-primarypurple/30"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    )}

                    {/* Title + author */}
                    <div>
                        <h1 className="text-3xl font-bold uppercase md:text-4xl">
                            {project.title}
                        </h1>
                        <p className="mt-1 text-sm text-gray-700">
                            by{" "}
                            <span className="font-semibold">
                                {project.owner_full_name}
                            </span>{" "}
                            —{" "}
                            <Link
                                href={`mailto:${project.owner_nu_email}`}
                                className="text-primarypurple underline"
                            >
                                {project.owner_nu_email}
                            </Link>
                        </p>
                    </div>

                    {/* Tags + GitHub */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {project.tags?.map((tagObj: any) => (
                                <span
                                    key={tagObj.tag}
                                    className="rounded bg-primarypurple/15 px-2 py-1 text-xs text-primarypurple"
                                >
                                    {tagObj.tag}
                                </span>
                            ))}
                        </div>

                        {project.github_url && (
                            <Link
                                href={project.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primarypurple underline"
                            >
                                {project.github_url.substring(0, 60)}
                                {project.github_url.length > 60 ? "..." : ""}
                            </Link>
                        )}
                    </div>

                    {/* Project description */}
                    <div className="mt-4">
                        <MdPreview
                            editorId={`project-description-${project.project_id ?? "preview"}`}
                            modelValue={project.description || ""}
                            previewTheme="github"
                            language="en-US"
                        />
                    </div>
                </div>

                {/* RIGHT: Issues */}
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                        <h2 className="text-lg font-semibold">Issues</h2>
                        <div className="flex gap-3 text-xs text-gray-700">
                            <span className="font-semibold text-primarypurple">
                                Open: {openIssues.length}
                            </span>
                            <span>Closed: {closedIssues.length}</span>
                        </div>
                    </div>

                    {issues.length === 0 && (
                        <p className="text-sm text-gray-600">
                            No issues have been created for this project yet.
                        </p>
                    )}

                    <div className="space-y-3">
                        {issues.map((issue: any, index: number) => (
                            <div
                                key={index}
                                className="space-y-2 rounded-xl border border-gray-200 bg-white p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-semibold">
                                        {issue.title}
                                    </h3>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${issue.status === "OPEN" || issue.status === "open"
                                            ? "bg-primarypurple/15 text-primarypurple"
                                            : "bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {issue.status === "OPEN" || issue.status === "open"
                                            ? "Open"
                                            : "Closed"}
                                    </span>
                                </div>

                                <div className="rounded-md border border-gray-100 bg-gray-50 p-2">
                                    <MdPreview
                                        editorId={`issue-${project.project_id ?? "p"}-${index}`}
                                        modelValue={issue.description || ""}
                                        previewTheme="github"
                                        language="en-US"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setIsEditOpen(false)}
                    />
                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Edit Project
                                </h2>
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="text-sm text-gray-500 hover:text-gray-800"
                                >
                                    Close
                                </button>
                            </div>
                            <EditProjectForm
                                project={project}
                                onClose={() => setIsEditOpen(false)}
                            />
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

/* ----------------- Page Component ----------------- */

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
