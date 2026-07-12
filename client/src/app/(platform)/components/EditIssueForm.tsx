"use client";

import React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { queryKeys } from "@/lib/queryKeys";
import { untrustedMarkdownProps } from "@/lib/markdownSecurity";

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
        "w-full p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";
    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"
        }`;

    return (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold" htmlFor="edit-issue-title">
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
                    <p id="edit-issue-title-error" className="mt-1 text-xs text-red-500">
                        {errors.title.message}
                    </p>
                )}
            </div>

            {/* Description (Markdown) */}
            <div className="flex flex-col">
                <p id="edit-issue-description-label" className="text-sm font-semibold">
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
                            className="mt-1 rounded-xl border-2 border-primarypurple/30 bg-white"
                        >
                            <MdEditor
                                {...untrustedMarkdownProps}
                                editorId="edit-issue-description"
                                language="en-US"
                                modelValue={field.value}
                                onChange={field.onChange}
                                previewTheme="github"
                                style={{ height: "180px" }}
                            />
                        </div>
                    )}
                />
                {errors.description && (
                    <p id="edit-issue-description-error" className="mt-1 text-xs text-red-500">
                        {errors.description.message}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={updateMutation.isPending}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={
                        !isValid || isSubmitting || updateMutation.isPending
                    }
                    className="rounded-lg bg-primarypurple px-4 py-2 text-sm font-semibold text-white hover:bg-primarypurple/90 disabled:opacity-60 transition"
                >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {updateMutation.isError && (
                <p className="mt-2 text-xs text-red-600" role="alert">
                    {(updateMutation.error as Error).message ||
                        "Failed to update issue."}
                </p>
            )}
        </form>
    );
};

export default EditIssueForm;
