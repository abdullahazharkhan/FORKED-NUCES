import React from 'react'
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import EditProjectForm from "../../../components/EditProjectForm";


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
            // Invalidate relevant lists
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["my-projects"] });

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
            <div className="my-6 grid gap-8 rounded-xl border border-gray-200 bg-primarypurple/5 p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
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
                                onClick={handleDeleteClick}
                                disabled={deleteMutation.isPending}
                                className="rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-200 disabled:opacity-60"
                            >
                                {deleteMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
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
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${issue.status === "OPEN" ||
                                            issue.status === "open"
                                            ? "bg-primarypurple/15 text-primarypurple"
                                            : "bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {issue.status === "OPEN" ||
                                            issue.status === "open"
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

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => !deleteMutation.isPending && setIsDeleteOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h2 className="text-lg font-semibold mb-2">
                                Delete Project
                            </h2>
                            <p className="text-sm text-gray-700 mb-4">
                                Are you sure you want to delete this project? This action
                                cannot be undone.
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
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
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

export default ProjectDetails