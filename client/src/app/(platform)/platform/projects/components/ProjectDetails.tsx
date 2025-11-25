"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import EditProjectForm from "../../../components/EditProjectForm";
import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import IssuesDetails from "./IssuesDetails";

const ProjectDetails = ({ project }: { project: any }) => {
    const issues = Array.isArray(project.issues) ? project.issues : [];

    const openIssues = issues.filter(
        (i: any) => i.status === "open" || i.status === "OPEN"
    );
    const closedIssues = issues.filter(
        (i: any) => i.status === "closed" || i.status === "CLOSED"
    );

    const loggedInUser = useAuthStore((s) => s.user);
    const isOwner = loggedInUser?.nu_email === project.owner_nu_email;

    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const router = useRouter();
    const queryClient = useQueryClient();

    const createdAt = project.created_at
        ? new Date(project.created_at).toLocaleDateString()
        : null;
    const updatedAt = project.updated_at
        ? new Date(project.updated_at).toLocaleDateString()
        : null;

    // DELETE mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await authFetch(`/api/projects/${project.project_id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to delete project"
                );
            }

            return body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({
                queryKey: ["project", project.project_id],
            });

            setIsDeleteOpen(false);
            router.push("/platform");
        },
        onError: (err) => {
            console.error("Delete project error", err);
            setDeleteError(
                (err as Error).message ||
                "Failed to delete project. Please try again."
            );
        },
    });


    const handleDeleteClick = () => {
        if (!isOwner) return;
        setDeleteError(null);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        setDeleteError(null);
        deleteMutation.mutate();
    };


    return (
        <>
            <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
                {/* HEADER: Title + actions */}
                <div className="relative">
                    {isOwner && (
                        <div className="absolute right-0 -top-2 flex gap-2">
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="rounded-lg border border-primarypurple/30 bg-primarypurple/10 px-3 py-1 text-sm font-semibold text-primarypurple transition hover:bg-primarypurple/30"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                disabled={deleteMutation.isPending}
                                className="rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-200 disabled:opacity-60"
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    )}

                    <h1 className="pr-32 text-3xl font-bold uppercase md:text-4xl">
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

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        {createdAt && <span>Created: {createdAt}</span>}
                        {updatedAt && <span>Updated: {updatedAt}</span>}
                        <span>
                            Issues: {issues.length} (Open {openIssues.length} /
                            Closed {closedIssues.length})
                        </span>
                    </div>
                </div>

                {/* TAGS + GITHUB */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-primarypurple/15 py-3">
                    <div className="flex flex-wrap gap-2">
                        {project.tags && project.tags.length > 0 ? (
                            project.tags.map((tagObj: any) => (
                                <span
                                    key={tagObj.tag}
                                    className="rounded bg-primarypurple/15 px-2 py-1 text-xs text-primarypurple"
                                >
                                    {tagObj.tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-gray-500">
                                No tags added to this project yet.
                            </span>
                        )}
                    </div>

                    {project.github_url && (
                        <Link
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primarypurple underline md:text-sm"
                        >
                            {project.github_url.substring(0, 60)}
                            {project.github_url.length > 60 ? "..." : ""}
                        </Link>
                    )}
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Description</h2>
                    <div className="rounded-xl border border-gray-200 p-3">
                        <MdPreview
                            editorId={`project-description-${project.project_id ?? "preview"}`}
                            modelValue={project.description || ""}
                            previewTheme="github"
                            language="en-US"
                        />
                    </div>
                </div>

                {/* ISSUES SECTION AT BOTTOM */}
                <IssuesDetails
                    project={project}
                    issues={issues}
                    openIssues={openIssues}
                    closedIssues={closedIssues}
                    isOwner={isOwner}
                />
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setIsEditOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 my-8 flex items-center justify-center px-4">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Edit Project</h2>
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

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() =>
                            !deleteMutation.isPending && setIsDeleteOpen(false)
                        }
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h2 className="mb-2 text-lg font-semibold">
                                Delete Project
                            </h2>
                            <p className="mb-4 text-sm text-gray-700">
                                Are you sure you want to delete this project? This
                                action cannot be undone.
                            </p>

                            {deleteError && (
                                <p className="mb-3 text-xs text-red-600">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleteMutation.isPending
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default ProjectDetails;
