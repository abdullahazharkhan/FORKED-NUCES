import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import EditProjectForm from "../../../components/EditProjectForm";
import { motion, AnimatePresence } from "framer-motion";
import { MdPreview, MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { z } from "zod";

// Zod schema for issue creation
const issueSchema = z.object({
    title: z.string().min(1, "Issue title is required"),
    description: z.string().min(1, "Issue description is required"),
});

const IssuesDetails = ({ project, openIssues, closedIssues, issues, isOwner }:
    { project: any; openIssues: any[]; closedIssues: any[]; issues: any[]; isOwner: boolean }) => {

    const queryClient = useQueryClient();


    const [isAddingIssue, setIsAddingIssue] = React.useState(false);
    const [newIssueTitle, setNewIssueTitle] = React.useState("");
    const [newIssueDescription, setNewIssueDescription] = React.useState("");
    const [openIssueId, setOpenIssueId] = React.useState<number | null>(null);
    const [issueErrors, setIssueErrors] = React.useState<{
        title?: string;
        description?: string;
        form?: string;
    }>({});



    const toggleIssue = (issueId: number) => {
        setOpenIssueId((prev) => (prev === issueId ? null : issueId));
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
                const error: any = new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to create issue"
                );
                // Attach field-level errors from DRF if present
                if (body && typeof body === "object") {
                    error.fieldErrors = body;
                }
                throw error;
            }

            return body;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({
                queryKey: ["project", project.project_id],
            });

            const previousProject = queryClient.getQueryData<any>([
                "project",
                project.project_id,
            ]);

            queryClient.setQueryData<any>(
                ["project", project.project_id],
                (old: any) =>
                    old
                        ? {
                            ...old,
                            issues: [
                                {
                                    issue_id: Date.now(),
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
        onSuccess: () => {
            setNewIssueTitle("");
            setNewIssueDescription("");
            setIssueErrors({});
            setIsAddingIssue(false);

            // Re-fetch project / projects
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({
                queryKey: ["project", project.project_id],
            });
        },
        onError: (err) => {
            console.error("Create issue error", err);
            const anyErr = err as any;
            const fieldErrors: {
                title?: string;
                description?: string;
                form?: string;
            } = {};

            if (anyErr.fieldErrors && typeof anyErr.fieldErrors === "object") {
                const fe = anyErr.fieldErrors;
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
                    (anyErr as Error).message ||
                    "Failed to create issue. Please try again.";
            }

            setIssueErrors(fieldErrors);
        },
    });

    // Submit handler for Add Issue form
    const handleAddIssueSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setIssueErrors({});

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
                if (typeof field === "string" && !fieldErrors[field as keyof typeof fieldErrors]) {
                    fieldErrors[field as keyof typeof fieldErrors] = issue.message;
                }
            });
            setIssueErrors((prev) => ({ ...prev, ...fieldErrors }));
            return;
        }

        createIssueMutation.mutate(trimmed);
    };

    return (
        <div className="space-y-3 border-t border-primarypurple/20 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Issues</h2>
                    <div className="flex gap-3 text-xs text-gray-700">
                        <span className="font-semibold text-primarypurple">
                            Open: {openIssues.length}
                        </span>
                        <span>Closed: {closedIssues.length}</span>
                    </div>
                </div>

                {/* Add Issue button (owner only) */}
                {isOwner && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingIssue((prev) => !prev);
                            setIssueErrors({});
                        }}
                        className="rounded-lg border border-primarypurple/30 bg-primarypurple/10 px-3 py-1 text-xs font-semibold text-primarypurple transition hover:bg-primarypurple/20"
                    >
                        {isAddingIssue ? "Cancel" : "Add Issue"}
                    </button>
                )}
            </div>

            {/* Inline Add Issue form */}
            {isOwner && isAddingIssue && (
                <form
                    onSubmit={handleAddIssueSubmit}
                    className="space-y-3 rounded-xl border border-primarypurple/25 bg-white/90 p-3 shadow-sm"
                >
                    {issueErrors.form && (
                        <p className="text-xs text-red-600">
                            {issueErrors.form}
                        </p>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Issue Title
                        </label>
                        <input
                            type="text"
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
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${issueErrors.title
                                ? "border-red-400 focus:border-red-500 focus:ring-red-300"
                                : "border-gray-200 focus:border-primarypurple focus:ring-primarypurple/50"
                                }`}
                        />
                        {issueErrors.title && (
                            <p className="text-[11px] text-red-600">
                                {issueErrors.title}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Issue Description
                        </label>

                        <div
                            className={`rounded-lg border p-2 ${issueErrors.description
                                ? "border-red-400"
                                : "border-gray-200"
                                }`}
                        >
                            <MdEditor
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
                            <p className="text-[11px] text-red-600">
                                {issueErrors.description}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingIssue(false);
                                setNewIssueTitle("");
                                setNewIssueDescription("");
                                setIssueErrors({});
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            disabled={createIssueMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-primarypurple px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primarypurple/90 disabled:opacity-60"
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
                <p className="text-sm text-gray-600">
                    No issues have been created for this project yet.
                </p>
            )}

            <div className="space-y-2">
                {issues.map((issue: any) => {
                    const isOpenIssueRow =
                        openIssueId === issue.issue_id ||
                        openIssueId === issue.id; // backend uses issue_id

                    const statusOpen =
                        issue.status === "OPEN" || issue.status === "open";

                    return (
                        <div
                            key={issue.issue_id ?? issue.id}
                            className="rounded-xl border border-primarypurple/20 bg-white/80 shadow-sm transition-colors hover:bg-primarypurple/5"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    toggleIssue(issue.issue_id ?? issue.id ?? 0)
                                }
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">
                                        {issue.title}
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                        {issue.created_at
                                            ? new Date(
                                                issue.created_at
                                            ).toLocaleDateString()
                                            : ""}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusOpen
                                            ? "bg-primarypurple/15 text-primarypurple"
                                            : "bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {statusOpen ? "Open" : "Closed"}
                                    </span>

                                    <motion.span
                                        animate={{
                                            rotate: isOpenIssueRow ? 90 : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs text-gray-500"
                                    >
                                        ▸
                                    </motion.span>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpenIssueRow && (
                                    <motion.div
                                        key="content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeOut",
                                        }}
                                        className="overflow-hidden border-t border-gray-100 bg-gray-50"
                                    >
                                        <div className="p-3">
                                            <MdPreview
                                                editorId={`issue-${project.project_id ?? "p"}-${issue.issue_id ?? issue.id
                                                    }`}
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
        </div>
    )
}

export default IssuesDetails