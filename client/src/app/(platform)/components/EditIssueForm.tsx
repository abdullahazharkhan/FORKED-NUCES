"use client";

import React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { queryKeys } from "@/lib/queryKeys";
import { untrustedMarkdownEditorProps } from "@/lib/markdownSecurity";

const editIssueSchema = z.object({
    title: z
        .string()
        .min(1, "Issue title is required")
        .max(255, "Issue title must be 255 characters or fewer"),
    description: z
        .string()
        .min(1, "Issue description is required")
        .max(10_000, "Issue description must be 10,000 characters or fewer"),
});

type EditIssueFormValues = z.infer<typeof editIssueSchema>;

interface EditIssueFormProps {
    issue: {
        description?: string;
        id?: number;
        issue_id?: number;
        title?: string;
    };
    projectId: number;
    onClose: () => void;
}

const EditIssueForm = ({
    issue,
    projectId,
    onClose,
}: EditIssueFormProps) => {
    const queryClient = useQueryClient();
    const issueId = issue.issue_id ?? issue.id;

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<EditIssueFormValues>({
        resolver: zodResolver(editIssueSchema),
        mode: "onChange",
        defaultValues: {
            title: issue.title || "",
            description: issue.description || "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: EditIssueFormValues) => {
            const res = await authFetch(`/api/issues/${issueId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to update issue"
                );
            }

            return body;
        },
        onSuccess: async () => {
            // Refresh project (and optionally projects list)
            await queryClient.invalidateQueries({
                queryKey: queryKeys.project(projectId),
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
            ]);

            onClose();
        },
    });

    const onSubmit = (data: EditIssueFormValues) => {
        updateMutation.mutate(data);
    };

    const baseInputClasses =
        "min-h-12 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:border-primarypurple focus:ring-4 focus:ring-primarypurple/10";
    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-black/15"
        }`;

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-black" htmlFor="edit-issue-title">
                    Issue Title
                </label>
                <input
                    id="edit-issue-title"
                    type="text"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={
                        errors.title ? "edit-issue-title-error" : undefined
                    }
                    {...register("title")}
                    className={getInputClass(errors.title)}
                />
                {errors.title && (
                    <p id="edit-issue-title-error" className="text-xs font-medium text-red-600">
                        {errors.title.message}
                    </p>
                )}
            </div>

            {/* Description (Markdown) */}
            <div className="flex flex-col gap-2">
                <p id="edit-issue-description-label" className="text-sm font-bold text-black">
                    Issue Description
                </p>
                <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <div
                            role="group"
                            aria-labelledby="edit-issue-description-label"
                            aria-describedby={
                                errors.description
                                    ? "edit-issue-description-error"
                                    : undefined
                            }
                            className={`overflow-hidden rounded-xl border bg-white ${errors.description ? "border-red-500" : "border-black/15"}`}
                        >
                            <MdEditor
                                {...untrustedMarkdownEditorProps}
                                editorId="edit-issue-description"
                                language="en-US"
                                modelValue={field.value}
                                onChange={field.onChange}
                                previewTheme="github"
                                style={{ height: "260px" }}
                            />
                        </div>
                    )}
                />
                {errors.description && (
                    <p id="edit-issue-description-error" className="text-xs font-medium text-red-600">
                        {errors.description.message}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-black/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={updateMutation.isPending}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04]"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={
                        !isValid || isSubmitting || updateMutation.isPending
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {updateMutation.isError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                    {(updateMutation.error as Error).message ||
                        "Failed to update issue."}
                </p>
            )}
        </form>
    );
};

export default EditIssueForm;
