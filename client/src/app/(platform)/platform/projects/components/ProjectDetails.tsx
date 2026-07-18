"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import EditProjectForm from "../../../components/EditProjectForm";
import { MdPreview } from "md-editor-rt";
import IssuesDetails from "./IssuesDetails";
import ProjectCollaborators from "./ProjectCollaborators";
import ProjectComments from "./ProjectComments";
import {
    ArrowLeft,
    CalendarDays,
    CircleDot,
    ExternalLink,
    GitFork,
    Heart,
    Mail,
    Pencil,
    Trash2,
} from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { AccessibleDialog } from "@/app/(platform)/components/AccessibleDialog";
import { ReportButton } from "@/app/(platform)/components/ReportButton";
import { untrustedMarkdownPreviewProps } from "@/lib/markdownSecurity";

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
            <article className="space-y-9">
                <nav aria-label="Project breadcrumb">
                    <Link
                        href="/platform"
                        className="group inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-bold text-black/60 transition-colors hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px"
                    >
                        <ArrowLeft
                            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                        Back to projects
                    </Link>
                </nav>

                <header className="relative isolate overflow-hidden rounded-lg border border-black/10 bg-primarypurple p-6 text-white shadow-[0_18px_50px_rgba(45,23,102,0.16)] sm:p-8 lg:p-10">
                    <div
                        className="landing-grid pointer-events-none absolute inset-0 opacity-20"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rotate-12 border-[2.5rem] border-primarygreen/15"
                        aria-hidden="true"
                    />

                    <div className="relative">
                        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                            <div className="min-w-0">
                                <p className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.14em] text-primarygreen">
                                    <GitFork className="h-4 w-4" aria-hidden="true" />
                                    Student project
                                </p>
                                <h1 className="mt-5 max-w-4xl break-words text-balance text-4xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                                    {project.title}
                                </h1>
                                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90">
                                    <span>Built by</span>
                                    <span className="font-bold text-white">
                                        {project.owner_full_name || "Unknown owner"}
                                    </span>
                                    {project.owner_nu_email && (
                                        <Link
                                            href={`mailto:${project.owner_nu_email}`}
                                            className="inline-flex items-center gap-1.5 rounded-md font-semibold text-primarygreen underline decoration-primarygreen/35 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                        >
                                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                            {project.owner_nu_email}
                                        </Link>
                                    )}
                                </p>
                            </div>

                            {(isOwner || loggedInUser) && (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {isOwner ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditOpen(true)}
                                                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3.5 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
                                            >
                                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                Edit project
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteClick}
                                                disabled={deleteMutation.isPending}
                                                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200/30 bg-red-500/15 px-3.5 text-xs font-bold text-white transition-colors hover:bg-red-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px disabled:cursor-wait disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
                        </div>

                        <dl className="mt-10 grid gap-px border-y border-white/20 bg-white/20 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="bg-primarypurple p-4">
                                <dt className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                    <CalendarDays className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                    Created
                                </dt>
                                <dd className="mt-2 text-sm font-bold text-white">
                                    {createdAt || "Not available"}
                                </dd>
                            </div>
                            <div className="bg-primarypurple p-4">
                                <dt className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                    <CalendarDays className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                    Last updated
                                </dt>
                                <dd className="mt-2 text-sm font-bold text-white">
                                    {updatedAt || "Not available"}
                                </dd>
                            </div>
                            <div className="bg-primarypurple p-4">
                                <dt className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                    <CircleDot className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                    Issues
                                </dt>
                                <dd className="mt-2 text-sm font-bold text-white">
                                    {openIssues.length} open · {closedIssues.length} closed
                                </dd>
                            </div>
                            <div className="bg-primarypurple p-4">
                                <dt className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                    <Heart
                                        className={`h-4 w-4 text-primarygreen ${hasLiked ? "fill-primarygreen" : ""}`}
                                        aria-hidden="true"
                                    />
                                    Community support
                                </dt>
                                <dd className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-sm font-bold text-white">
                                        {likeCount} {likeCount === 1 ? "like" : "likes"}
                                    </span>
                                    <button
                                        type="button"
                                        aria-pressed={hasLiked}
                                        onClick={handleLikeClick}
                                        disabled={likeMutation.isPending || !loggedInUser || isOwner}
                                        title={isOwner ? "You cannot like your own project" : undefined}
                                        className="rounded-md bg-primarygreen px-3 py-1.5 text-xs font-black text-black transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/45"
                                    >
                                        {hasLiked ? "Unlike" : "Like"}
                                    </button>
                                </dd>
                            </div>
                        </dl>

                        {likeError && (
                            <p className="mt-4 border-l-2 border-red-200 bg-red-500/15 px-4 py-3 text-xs font-semibold text-white" role="alert">
                                {likeError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2" aria-label="Project tags">
                                {project.tags && project.tags.length > 0 ? (
                                    project.tags.map((tagObj) => (
                                        <span
                                            key={tagObj.tag}
                                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90"
                                        >
                                            {tagObj.tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-white/90">
                                        No tags added yet
                                    </span>
                                )}
                            </div>

                            {project.github_url && (
                                <Link
                                    href={project.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black text-black transition-colors hover:bg-primarygreen focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
                                >
                                    View repository
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <section className="border-y border-black/15 bg-white/80 p-5 sm:p-8">
                    <div className="mb-6 grid gap-2 border-b border-black/10 pb-5 sm:grid-cols-[10rem_1fr] sm:items-end">
                        <p className="font-mono text-xs font-bold tracking-[0.14em] text-primarypurple">
                            Project overview
                        </p>
                        <h2 className="text-2xl font-black tracking-[-0.03em] text-black sm:text-3xl">
                            About this project
                        </h2>
                    </div>
                    <div className="overflow-hidden border-l-2 border-primarypurple/25 bg-[#fbfaff] p-3 sm:p-5">
                        <MdPreview
                            {...untrustedMarkdownPreviewProps}
                            editorId={`project-description-${project.project_id ?? "preview"}`}
                            modelValue={project.description || ""}
                            previewTheme="github"
                            language="en-US"
                        />
                    </div>
                </section>

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
            </article>

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
                    <p className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-900">
                        Are you sure you want to delete this project? This action
                        cannot be undone.
                    </p>

                    {deleteError && (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                            {deleteError}
                        </p>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            data-dialog-initial-focus="true"
                            disabled={deleteMutation.isPending}
                            onClick={() => setIsDeleteOpen(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04] disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
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
