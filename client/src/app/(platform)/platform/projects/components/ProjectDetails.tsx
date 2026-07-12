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
import ProjectCollaborators from "./ProjectCollaborators";
import ProjectComments from "./ProjectComments";
import { Heart } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { AccessibleDialog } from "@/app/(platform)/components/AccessibleDialog";
import { ReportButton } from "@/app/(platform)/components/ReportButton";
import { untrustedMarkdownProps } from "@/lib/markdownSecurity";

type ProjectDetailsData = {
    project_id: number;
    title: string;
    description?: string;
    github_url?: string;
    created_at?: string;
    updated_at?: string;
    owner_user_id?: number;
    owner_full_name?: string;
    owner_nu_email?: string;
    likes_count?: number;
    user_has_liked?: boolean;
    tags?: Array<{ tag: string }>;
    issues?: Array<{
        issue_id?: number;
        id?: number;
        title?: string;
        description?: string;
        status?: string;
        created_at?: string;
        updated_at?: string;
    }>;
};

const ProjectDetails = ({ project }: { project: ProjectDetailsData }) => {
    const issues = Array.isArray(project.issues) ? project.issues : [];

    const openIssues = issues.filter(
        (issue) => issue.status === "open" || issue.status === "OPEN"
    );
    const closedIssues = issues.filter(
        (issue) => issue.status === "closed" || issue.status === "CLOSED"
    );

    const loggedInUser = useAuthStore((s) => s.user);
    const isOwner = Boolean(
        loggedInUser &&
            (project.owner_user_id
                ? loggedInUser.user_id === project.owner_user_id
                : loggedInUser.nu_email === project.owner_nu_email)
    );

    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const likeCount = project.likes_count ?? 0;
    const hasLiked = project.user_has_liked ?? false;
    const [likeError, setLikeError] = React.useState<string | null>(null);

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
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.project(project.project_id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
            ]);

            setIsDeleteOpen(false);
            router.push("/platform");
        },
        onError: (err) => {
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

    // LIKE mutation
    const likeMutation = useMutation({
        mutationFn: async (currentlyLiked: boolean) => {
            const res = await authFetch(`/api/likes/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: project.project_id,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to like project"
                );
            }

            return body;
        },
        onMutate: async (currentlyLiked) => {
            setLikeError(null);

            const projectKey = queryKeys.project(project.project_id);
            await queryClient.cancelQueries({ queryKey: projectKey });

            const previousProject =
                queryClient.getQueryData<ProjectDetailsData>(projectKey) ??
                project;
            const delta = currentlyLiked ? -1 : 1;

            queryClient.setQueryData<ProjectDetailsData>(projectKey, {
                ...previousProject,
                likes_count: Math.max(
                    0,
                    (previousProject.likes_count ?? 0) + delta
                ),
                user_has_liked: !currentlyLiked,
            });

            return { previousProject };
        },
        onError: (err, _currentlyLiked, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    queryKeys.project(project.project_id),
                    context.previousProject
                );
            }
            setLikeError(
                (err as Error).message ||
                "Failed to like this project. Please try again."
            );
        },
        onSuccess: async (data) => {
            if (typeof data?.liked === "boolean") {
                queryClient.setQueryData<ProjectDetailsData>(
                    queryKeys.project(project.project_id),
                    (current) =>
                        current
                            ? { ...current, user_has_liked: data.liked }
                            : current
                );
            }
            // Refresh project + projects list
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.project(project.project_id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
            ]);
        },
    });

    const handleLikeClick = () => {
        if (!loggedInUser) {
            setLikeError("Please log in to like this project.");
            return;
        }
        if (isOwner) {
            setLikeError("You cannot like your own project.");
            return;
        }
        if (likeMutation.isPending) return;
        likeMutation.mutate(hasLiked);
    };

    return (
        <>
            <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
                {/* HEADER: Title + actions */}
                <div className="relative">
                    {(isOwner || loggedInUser) && (
                        <div className="mb-3 flex flex-wrap justify-end gap-2 sm:absolute sm:-top-2 sm:right-0 sm:mb-0">
                            {isOwner ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(true)}
                                        className="rounded-lg border border-primarypurple/30 bg-primarypurple/10 px-3 py-1 text-sm font-semibold text-primarypurple transition hover:bg-primarypurple/30"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteClick}
                                        disabled={deleteMutation.isPending}
                                        className="rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-200 disabled:opacity-60"
                                    >
                                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                    </button>
                                </>
                            ) : (
                                <ReportButton
                                    targetType="project"
                                    targetId={project.project_id}
                                    targetLabel={project.title}
                                />
                            )}
                        </div>
                    )}

                    <h1 className="text-3xl font-bold uppercase sm:pr-40 md:text-4xl">
                        {project.title}
                    </h1>

                    <p className="mt-1 text-sm text-gray-700">
                        by{" "}
                        <span className="font-semibold">
                            {project.owner_full_name || "Unknown owner"}
                        </span>
                        {project.owner_nu_email && (
                            <>
                                {" — "}
                                <Link
                                    href={`mailto:${project.owner_nu_email}`}
                                    className="text-primarypurple underline"
                                >
                                    {project.owner_nu_email}
                                </Link>
                            </>
                        )}
                    </p>

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        {createdAt && <span>Created: {createdAt}</span>}
                        {updatedAt && <span>Updated: {updatedAt}</span>}
                        <span>
                            Issues: {issues.length} (Open {openIssues.length} / Closed{" "}
                            {closedIssues.length})
                        </span>

                        {/* Likes display + button */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 text-primarypurple font-semibold">
                                <Heart
                                    size={16}
                                    aria-hidden="true"
                                    className={
                                        hasLiked
                                            ? "fill-primarypurple text-primarypurple"
                                            : "text-primarypurple"
                                    }
                                />
                                {likeCount} {likeCount === 1 ? "like" : "likes"}
                            </span>

                            <button
                                type="button"
                                onClick={handleLikeClick}
                                disabled={
                                    likeMutation.isPending || !loggedInUser || isOwner
                                }
                                title={isOwner ? "You cannot like your own project" : undefined}
                                className="rounded-full border border-primarypurple/40 bg-white px-3 py-1 text-xs font-semibold text-primarypurple transition hover:bg-primarypurple/10 disabled:opacity-60"
                            >
                                {hasLiked ? "Unlike" : "Like"}
                            </button>
                        </div>
                    </div>

                    {likeError && (
                        <p className="mt-1 text-[11px] text-red-600" role="alert">
                            {likeError}
                        </p>
                    )}
                </div>

                {/* TAGS + GITHUB */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-primarypurple/15 py-3">
                    <div className="flex flex-wrap gap-2">
                        {project.tags && project.tags.length > 0 ? (
                            project.tags.map((tagObj) => (
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
                            {...untrustedMarkdownProps}
                            editorId={`project-description-${project.project_id ?? "preview"}`}
                            modelValue={project.description || ""}
                            previewTheme="github"
                            language="en-US"
                        />
                    </div>
                </div>

                {/* ISSUES SECTION */}
                <IssuesDetails
                    project={project}
                    issues={issues}
                    openIssues={openIssues}
                    closedIssues={closedIssues}
                    isOwner={isOwner}
                />

                {/* Collaborators */}
                <ProjectCollaborators projectid={project.project_id} />

                {/* Comments */}
                <ProjectComments 
                    projectid={project.project_id} 
                    projectOwnerId={project.owner_user_id}
                />
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <AccessibleDialog
                    title="Edit Project"
                    className="max-w-2xl"
                    onClose={() => setIsEditOpen(false)}
                >
                    <EditProjectForm
                        project={project}
                        onClose={() => setIsEditOpen(false)}
                    />
                </AccessibleDialog>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <AccessibleDialog
                    title="Delete Project"
                    closeDisabled={deleteMutation.isPending}
                    onClose={() => setIsDeleteOpen(false)}
                >
                    <p className="mb-4 text-sm text-gray-700">
                        Are you sure you want to delete this project? This action
                        cannot be undone.
                    </p>

                    {deleteError && (
                        <p className="mb-3 text-xs text-red-600" role="alert">
                            {deleteError}
                        </p>
                    )}

                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            data-dialog-initial-focus="true"
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
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </AccessibleDialog>
            )}
        </>
    );
};

export default ProjectDetails;
