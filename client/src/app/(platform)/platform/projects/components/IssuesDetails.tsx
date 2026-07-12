import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MdPreview, MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { z } from "zod";
import {
    CheckCircle2,
    ChevronRight,
    CircleDot,
    Inbox,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import EditIssueForm from "@/app/(platform)/components/EditIssueForm";
import CloseIssueForm from "@/app/(platform)/components/CloseIssueForm";
import { AccessibleDialog } from "@/app/(platform)/components/AccessibleDialog";
import { ReportButton } from "@/app/(platform)/components/ReportButton";
import { queryKeys } from "@/lib/queryKeys";
import { untrustedMarkdownProps } from "@/lib/markdownSecurity";

const MAX_ISSUES_PER_PROJECT = 100;

const issueSchema = z.object({
    title: z
        .string()
        .min(1, "Issue title is required")
        .max(255, "Issue title must be 255 characters or fewer"),
    description: z
        .string()
        .min(1, "Issue description is required")
        .max(10_000, "Issue description must be 10,000 characters or fewer"),
});

type Issue = {
    issue_id?: number;
    id?: number;
    title?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
};

type ProjectWithIssues = {
    project_id: number;
    issues?: Issue[];
};

type IssueMutationError = Error & {
    fieldErrors?: Record<string, unknown>;
};

const IssuesDetails = ({
    project,
    openIssues,
    closedIssues,
    issues,
    isOwner,
}: {
    project: ProjectWithIssues;
    openIssues: Issue[];
    closedIssues: Issue[];
    issues: Issue[];
    isOwner: boolean;
}) => {
    const queryClient = useQueryClient();
    const hasReachedIssueLimit = issues.length >= MAX_ISSUES_PER_PROJECT;

    const [isAddingIssue, setIsAddingIssue] = React.useState(false);
    const [newIssueTitle, setNewIssueTitle] = React.useState("");
    const [newIssueDescription, setNewIssueDescription] = React.useState("");
    const [openIssueId, setOpenIssueId] = React.useState<number | null>(null);
    const [issueErrors, setIssueErrors] = React.useState<{
        title?: string;
        description?: string;
        form?: string;
    }>({});

    // Close issue modal state
    const [isCloseIssueOpen, setIsCloseIssueOpen] = React.useState(false);
    const [issueToClose, setIssueToClose] = React.useState<number | null>(null);

    // Edit issue modal state
    const [isEditIssueOpen, setIsEditIssueOpen] = React.useState(false);
    const [issueBeingEdited, setIssueBeingEdited] = React.useState<Issue | null>(null);

    // Delete issue modal state
    const [isIssueDeleteOpen, setIsIssueDeleteOpen] = React.useState(false);
    const [issueToDelete, setIssueToDelete] = React.useState<number | null>(null);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const toggleIssue = (issueId: number) => {
        setOpenIssueId((prev) => (prev === issueId ? null : issueId));
    };

    const handleDeleteIssue = (issueId: number) => {
        setIssueToDelete(issueId);
        setDeleteError(null);
        setIsIssueDeleteOpen(true);
    };

    const handleEditIssue = (issue: Issue) => {
        setIssueBeingEdited(issue);
        setIsEditIssueOpen(true);
    };


    const handleMarkDoneIssue = (issueId: number) => {
        setIssueToClose(issueId);
        setIsCloseIssueOpen(true);
    };

    const createIssueMutation = useMutation({
        mutationFn: async (data: { title: string; description: string }) => {
            const res = await authFetch(`/api/issues/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: project.project_id,
                    title: data.title,
                    description: data.description,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                const error = new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to create issue"
                ) as IssueMutationError;
                if (body && typeof body === "object") {
                    error.fieldErrors = body as Record<string, unknown>;
                }
                throw error;
            }

            return body;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.project(project.project_id),
            });

            const previousProject = queryClient.getQueryData<ProjectWithIssues>(
                queryKeys.project(project.project_id)
            );

            queryClient.setQueryData<ProjectWithIssues>(
                queryKeys.project(project.project_id),
                (old) =>
                    old
                        ? {
                            ...old,
                            issues: [
                                {
                                    issue_id: -Date.now(),
                                    title: data.title,
                                    description: data.description,
                                    status: "OPEN",
                                    created_at: new Date().toISOString(),
                                },
                                ...(old.issues ?? []),
                            ],
                        }
                        : old
            );

            return { previousProject };
        },
        onSuccess: async () => {
            setNewIssueTitle("");
            setNewIssueDescription("");
            setIssueErrors({});
            setIsAddingIssue(false);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.project(project.project_id) }),
            ]);
        },
        onError: (err, _vars, context) => {
            const mutationError = err as IssueMutationError;
            const fieldErrors: {
                title?: string;
                description?: string;
                form?: string;
            } = {};

            if (mutationError.fieldErrors && typeof mutationError.fieldErrors === "object") {
                const fe = mutationError.fieldErrors;
                if (Array.isArray(fe.title) && fe.title[0]) {
                    fieldErrors.title = String(fe.title[0]);
                }
                if (Array.isArray(fe.description) && fe.description[0]) {
                    fieldErrors.description = String(fe.description[0]);
                }
                if (Array.isArray(fe.non_field_errors) && fe.non_field_errors[0]) {
                    fieldErrors.form = String(fe.non_field_errors[0]);
                }
            }

            if (!fieldErrors.title && !fieldErrors.description && !fieldErrors.form) {
                fieldErrors.form =
                    mutationError.message ||
                    "Failed to create issue. Please try again.";
            }

            setIssueErrors(fieldErrors);

            // rollback optimistic create if needed
            if (context?.previousProject) {
                queryClient.setQueryData(
                    queryKeys.project(project.project_id),
                    context.previousProject
                );
            }
        },
    });

    // DELETE issue mutation
    const deleteIssueMutation = useMutation({
        mutationFn: async (issueId: number) => {
            const res = await authFetch(`/api/issues/${issueId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to delete issue"
                );
            }

            return body;
        },
        onMutate: async (issueId) => {
            setDeleteError(null);
            await queryClient.cancelQueries({
                queryKey: queryKeys.project(project.project_id),
            });

            const previousProject = queryClient.getQueryData<ProjectWithIssues>(
                queryKeys.project(project.project_id)
            );

            queryClient.setQueryData<ProjectWithIssues>(
                queryKeys.project(project.project_id),
                (old) =>
                    old
                        ? {
                            ...old,
                            issues: (old.issues ?? []).filter(
                                (issue) => (issue.issue_id ?? issue.id) !== issueId
                            ),
                        }
                        : old
            );

            return { previousProject };
        },
        onError: (err, _issueId, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(
                    queryKeys.project(project.project_id),
                    context.previousProject
                );
            }
            setDeleteError(
                (err as Error).message ||
                "Failed to delete issue. Please try again."
            );
        },
        onSuccess: async () => {
            setIsIssueDeleteOpen(false);
            setIssueToDelete(null);
            setDeleteError(null);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.project(project.project_id) }),
            ]);
        },
    });

    const handleConfirmDeleteIssue = () => {
        if (!issueToDelete || deleteIssueMutation.isPending) return;
        deleteIssueMutation.mutate(issueToDelete);
    };

    // Submit handler for Add Issue form
    const handleAddIssueSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setIssueErrors({});

        if (hasReachedIssueLimit) {
            setIssueErrors({
                form: `A project can contain at most ${MAX_ISSUES_PER_PROJECT} issues.`,
            });
            return;
        }

        const trimmed = {
            title: newIssueTitle.trim(),
            description: newIssueDescription.trim(),
        };

        const result = issueSchema.safeParse(trimmed);

        if (!result.success) {
            const fieldErrors: {
                title?: string;
                description?: string;
            } = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (
                    typeof field === "string" &&
                    !fieldErrors[field as keyof typeof fieldErrors]
                ) {
                    fieldErrors[field as keyof typeof fieldErrors] = issue.message;
                }
            });
            setIssueErrors((prev) => ({ ...prev, ...fieldErrors }));
            return;
        }

        createIssueMutation.mutate(trimmed);
    };

    return (
        <>
            <section className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5 shadow-[0_16px_45px_rgba(44,27,92,0.06)] sm:p-8" aria-labelledby="project-issues-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                            Work ready to join
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h2 id="project-issues-heading" className="text-2xl font-black tracking-[-0.03em] text-black">
                                Project issues
                            </h2>
                            <span className="rounded-full bg-primarygreen/25 px-2.5 py-1 text-xs font-bold text-black">
                                {openIssues.length} open
                            </span>
                            <span className="text-xs font-semibold text-black/45">
                                {closedIssues.length} closed
                            </span>
                        </div>
                    </div>

                    {/* Add Issue button (owner only) */}
                    {isOwner && (
                        <button
                            type="button"
                            aria-expanded={isAddingIssue}
                            aria-controls="add-issue-form"
                            disabled={hasReachedIssueLimit}
                            title={
                                hasReachedIssueLimit
                                    ? `This project has reached the ${MAX_ISSUES_PER_PROJECT}-issue limit.`
                                    : undefined
                            }
                            onClick={() => {
                                setIsAddingIssue((prev) => !prev);
                                setIssueErrors({});
                            }}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primarypurple px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {!hasReachedIssueLimit && !isAddingIssue && (
                                <Plus className="h-4 w-4" aria-hidden="true" />
                            )}
                            {hasReachedIssueLimit
                                ? "Issue limit reached"
                                : isAddingIssue
                                  ? "Cancel"
                                  : "Add Issue"}
                        </button>
                    )}
                </div>

                {/* Inline Add Issue form */}
                {isOwner && isAddingIssue && (
                    <form
                        id="add-issue-form"
                        onSubmit={handleAddIssueSubmit}
                        className="mt-6 space-y-5 rounded-2xl border border-primarypurple/20 bg-[#f8f7fc] p-4 sm:p-6"
                    >
                        <div>
                            <h3 className="text-lg font-black tracking-[-0.02em] text-black">
                                Create an issue
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-black/50">
                                Describe a focused task that another student can pick up.
                            </p>
                        </div>
                        {issueErrors.form && (
                            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                                {issueErrors.form}
                            </p>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="new-issue-title"
                                className="text-sm font-bold text-black"
                            >
                                Issue Title
                            </label>
                            <input
                                id="new-issue-title"
                                type="text"
                                aria-invalid={Boolean(issueErrors.title)}
                                aria-describedby={
                                    issueErrors.title
                                        ? "new-issue-title-error"
                                        : undefined
                                }
                                value={newIssueTitle}
                                onChange={(e) => {
                                    setNewIssueTitle(e.target.value);
                                    if (issueErrors.title) {
                                        setIssueErrors((prev) => ({
                                            ...prev,
                                            title: undefined,
                                        }));
                                    }
                                }}
                                placeholder="Short summary of the issue"
                                className={`min-h-12 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:ring-4 ${issueErrors.title
                                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                    : "border-black/15 focus:border-primarypurple focus:ring-primarypurple/10"
                                    }`}
                            />
                            {issueErrors.title && (
                                <p
                                    id="new-issue-title-error"
                                    className="text-[11px] text-red-600"
                                >
                                    {issueErrors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p
                                id="new-issue-description-label"
                                className="text-sm font-bold text-black"
                            >
                                Issue Description
                            </p>

                            <div
                                role="group"
                                aria-labelledby="new-issue-description-label"
                                aria-describedby={
                                    issueErrors.description
                                        ? "new-issue-description-error"
                                        : undefined
                                }
                                className={`overflow-hidden rounded-xl border bg-white ${issueErrors.description
                                    ? "border-red-400"
                                    : "border-black/15"
                                    }`}
                            >
                                <MdEditor
                                    {...untrustedMarkdownProps}
                                    editorId={`new-issue-${project.project_id ?? "p"}`}
                                    modelValue={newIssueDescription}
                                    onChange={(val) => {
                                        setNewIssueDescription(val);
                                        if (issueErrors.description) {
                                            setIssueErrors((prev) => ({
                                                ...prev,
                                                description: undefined,
                                            }));
                                        }
                                    }}
                                    language="en-US"
                                    previewTheme="github"
                                    style={{ height: 200 }}
                                />
                            </div>
                            {issueErrors.description && (
                                <p
                                    id="new-issue-description-error"
                                    className="text-[11px] text-red-600"
                                >
                                    {issueErrors.description}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingIssue(false);
                                    setNewIssueTitle("");
                                    setNewIssueDescription("");
                                    setIssueErrors({});
                                }}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 bg-white px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04]"
                                disabled={createIssueMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
                                disabled={createIssueMutation.isPending}
                            >
                                {createIssueMutation.isPending
                                    ? "Creating..."
                                    : "Create Issue"}
                            </button>
                        </div>
                    </form>
                )}

                {issues.length === 0 && !isAddingIssue && (
                    <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-[#fbfaff] px-5 py-10 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                            <Inbox className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-sm font-bold text-black">
                            No issues yet
                        </p>
                        <p className="mt-1 text-sm text-black/50">
                            There is no open work listed for this project.
                        </p>
                    </div>
                )}

                <div className="mt-6 space-y-3">
                    {issues.map((issue) => {
                        const isOpenIssueRow =
                            openIssueId === issue.issue_id ||
                            openIssueId === issue.id;

                        const statusOpen =
                            issue.status === "OPEN" || issue.status === "open";

                        const issueId = issue.issue_id ?? issue.id;
                        if (issueId == null) return null;
                        const isOptimistic = issueId < 0;
                        const contentId = `issue-content-${issueId}`;

                        return (
                            <div
                                key={issueId}
                                className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition-all hover:border-primarypurple/25 hover:shadow-[0_12px_30px_rgba(44,27,92,0.07)]"
                            >
                                <div className="flex w-full flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                    {/* Left: title + date (click to expand) */}
                                    <button
                                        type="button"
                                        onClick={() => toggleIssue(issueId)}
                                        aria-expanded={isOpenIssueRow}
                                        aria-controls={contentId}
                                        className="group flex min-h-11 flex-1 items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusOpen ? "bg-primarygreen/25 text-black" : "bg-black/[0.05] text-black/40"}`}>
                                                <CircleDot className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                            <span className="flex min-w-0 flex-col">
                                            <span className="break-words text-sm font-bold text-black group-hover:text-primarypurple">
                                                {issue.title}
                                            </span>
                                            <span className="mt-1 text-xs text-black/40">
                                                {issue.created_at
                                                    ? new Date(
                                                        issue.created_at
                                                    ).toLocaleDateString()
                                                    : ""}
                                            </span>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusOpen
                                                    ? "bg-primarypurple/10 text-primarypurple"
                                                    : "bg-black/[0.06] text-black/50"
                                                    }`}
                                            >
                                                {isOptimistic
                                                    ? "Saving..."
                                                    : statusOpen
                                                        ? "Open"
                                                        : "Closed"}
                                            </span>

                                            <motion.span
                                                animate={{
                                                    rotate: isOpenIssueRow ? 90 : 0,
                                                }}
                                                transition={{ duration: 0.2 }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.035] text-black/45"
                                                aria-hidden="true"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </motion.span>
                                        </div>
                                    </button>

                                    {/* Right: owner controls or member reporting */}
                                    {!isOptimistic && (isOwner ? (
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:pl-2">
                                            {/* Mark as Done */}
                                            {statusOpen && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMarkDoneIssue(issueId)
                                                    }
                                                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                    Mark as Closed
                                                </button>
                                            )}

                                            {/* Edit */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEditIssue(issue)
                                                }
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-black/45 transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                                aria-label="Edit issue"
                                            >
                                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteIssue(issueId)
                                                }
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                                                aria-label="Delete issue"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : (
                                        <ReportButton
                                            targetId={issueId}
                                            targetLabel={issue.title || `issue ${issueId}`}
                                            targetType="issue"
                                        />
                                    ))}
                                </div>

                                <AnimatePresence initial={false}>
                                    {isOpenIssueRow && (
                                        <motion.div
                                            key="content"
                                            id={contentId}
                                            initial={{
                                                height: 0,
                                                opacity: 0,
                                            }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{
                                                height: 0,
                                                opacity: 0,
                                            }}
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeOut",
                                            }}
                                            className="overflow-hidden border-t border-black/[0.07] bg-[#fbfaff]"
                                        >
                                            <div className="p-4 sm:p-5">
                                                <MdPreview
                                                    {...untrustedMarkdownProps}
                                                    editorId={`issue-${project.project_id ?? "p"}-${issueId}`}
                                                    modelValue={
                                                        issue.description || ""
                                                    }
                                                    previewTheme="github"
                                                    language="en-US"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Close issue modal */}
            {isCloseIssueOpen && issueToClose !== null && (
                <AccessibleDialog
                    title="Close Issue"
                    onClose={() => setIsCloseIssueOpen(false)}
                >
                    <CloseIssueForm
                        issueId={issueToClose}
                        projectId={project.project_id}
                        onClose={() => setIsCloseIssueOpen(false)}
                    />
                </AccessibleDialog>
            )}

            {/* Edit Issue Modal */}
            {isEditIssueOpen && issueBeingEdited && (
                <AccessibleDialog
                    title="Edit Issue"
                    className="max-w-2xl"
                    onClose={() => setIsEditIssueOpen(false)}
                >
                    <EditIssueForm
                        issue={issueBeingEdited}
                        projectId={project.project_id}
                        onClose={() => setIsEditIssueOpen(false)}
                    />
                </AccessibleDialog>
            )}

            {/* Delete Issue Confirmation Modal */}
            {isIssueDeleteOpen && (
                <AccessibleDialog
                    title="Delete Issue"
                    closeDisabled={deleteIssueMutation.isPending}
                    onClose={() => setIsIssueDeleteOpen(false)}
                >
                    <p className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-900">
                        Are you sure you want to delete this issue? This action
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
                            disabled={deleteIssueMutation.isPending}
                            onClick={() => setIsIssueDeleteOpen(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04] disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDeleteIssue}
                            disabled={deleteIssueMutation.isPending}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
                        >
                            {deleteIssueMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                        </button>
                    </div>
                </AccessibleDialog>
            )}
        </>
    );
};

export default IssuesDetails;
