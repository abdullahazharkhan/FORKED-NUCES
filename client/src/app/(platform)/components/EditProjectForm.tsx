"use client";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { queryKeys } from "@/lib/queryKeys";
import { untrustedMarkdownEditorProps } from "@/lib/markdownSecurity";
import {
    GITHUB_REPOSITORY_URL_ERROR,
    GITHUB_REPOSITORY_URL_REGEX,
    PROJECT_TAG_LABELS,
    PROJECT_TAGS,
    type ProjectTag,
} from "@/lib/projectMetadata";

const availableTagSet = new Set<string>(PROJECT_TAGS);

const editProjectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(10_000, "Description must be 10,000 characters or fewer"),
    github_url: z
        .string()
        .trim()
        .min(1, "GitHub URL is required")
        .url("Please enter a valid URL")
        .regex(GITHUB_REPOSITORY_URL_REGEX, GITHUB_REPOSITORY_URL_ERROR),
    tags: z
        .array(z.enum(PROJECT_TAGS))
        .min(1, "Select at least one tag"),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
    project: {
        project_id: number;
        title?: string;
        description?: string;
        github_url?: string;
        tags?: Array<{ tag?: string }>;
    };
    onClose: () => void;
}

const EditProjectForm = ({ project, onClose }: EditProjectFormProps) => {
    const queryClient = useQueryClient();

    const defaultTags: ProjectTag[] = Array.isArray(project.tags)
        ? project.tags
            .map((tag) => tag.tag)
            .filter(
                (tag): tag is ProjectTag =>
                    typeof tag === "string" && availableTagSet.has(tag)
            )
        : [];

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<EditProjectFormValues>({
        resolver: zodResolver(editProjectSchema),
        mode: "onChange",
        defaultValues: {
            title: project.title || "",
            description: project.description || "",
            github_url: project.github_url || "",
            tags: defaultTags,
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: EditProjectFormValues) => {
            const res = await authFetch(`/api/projects/${project.project_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    github_url: data.github_url,
                    tags: data.tags, // already string[]
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(body?.detail || "Failed to update project");
            }

            return body;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.project(project.project_id),
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
            ]);

            onClose();
        },
    });

    const onSubmit = (data: EditProjectFormValues) => {
        updateMutation.mutate(data);
    };

    const baseInputClasses =
        "min-h-12 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:border-primarypurple focus:ring-4 focus:ring-primarypurple/10";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-black/[0.08]"
        }`;

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-black" htmlFor="edit-project-title">
                    Title
                </label>
                <input
                    id="edit-project-title"
                    type="text"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={
                        errors.title ? "edit-project-title-error" : undefined
                    }
                    {...register("title")}
                    className={getInputClass(errors.title)}
                />
                {errors.title && (
                    <p id="edit-project-title-error" className="text-xs font-medium text-red-600">{errors.title.message}</p>
                )}
            </div>

            {/* Description (Markdown) */}
            <div className="flex flex-col gap-2">
                <p id="edit-project-description-label" className="text-sm font-bold text-black">
                    Description
                </p>
                <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <div
                            role="group"
                            aria-labelledby="edit-project-description-label"
                            aria-describedby={
                                errors.description
                                    ? "edit-project-description-error"
                                    : undefined
                            }
                            className={`overflow-hidden rounded-2xl border bg-white ${errors.description ? "border-red-500" : "border-black/[0.08]"}`}
                        >
                            <MdEditor
                                {...untrustedMarkdownEditorProps}
                                editorId="edit-project-description"
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
                    <p id="edit-project-description-error" className="text-xs font-medium text-red-600">
                        {errors.description.message}
                    </p>
                )}
            </div>

            {/* GitHub URL */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-black" htmlFor="edit-project-github-url">
                    GitHub URL
                </label>
                <input
                    id="edit-project-github-url"
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="https://github.com/username/project_name"
                    aria-invalid={Boolean(errors.github_url)}
                    aria-describedby={
                        errors.github_url
                            ? "edit-project-github-url-error"
                            : "edit-project-github-url-help"
                    }
                    {...register("github_url")}
                    className={getInputClass(errors.github_url)}
                />
                {!errors.github_url && (
                    <p id="edit-project-github-url-help" className="text-xs text-black/60">
                        Required format: https://github.com/username/project_name
                    </p>
                )}
                {errors.github_url && (
                    <p id="edit-project-github-url-error" className="text-xs font-medium text-red-600">
                        {errors.github_url.message}
                    </p>
                )}
            </div>

            {/* Tags (multi-select from allowed list) */}
            <div className="flex flex-col gap-2">
                <p id="edit-project-tags-label" className="text-sm font-bold text-black">
                    Tags
                </p>
                <Controller
                    control={control}
                    name="tags"
                    render={({ field }) => {
                        const value: ProjectTag[] = field.value || [];
                        const toggleTag = (tag: ProjectTag, checked: boolean) => {
                            if (checked) {
                                field.onChange([...value, tag]);
                            } else {
                                field.onChange(value.filter((t) => t !== tag));
                            }
                        };

                        return (
                            <div
                                role="group"
                                aria-labelledby="edit-project-tags-label"
                                aria-describedby={
                                    errors.tags
                                        ? "edit-project-tags-error"
                                        : undefined
                                }
                                className="flex flex-wrap gap-2"
                            >
                                {PROJECT_TAGS.map((tag) => {
                                    const checked = value.includes(tag);
                                    return (
                                        <label
                                            key={tag}
                                            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${checked
                                                ? "border-primarypurple bg-primarypurple text-white shadow-[0_6px_16px_rgba(76,41,178,0.14)]"
                                                : "border-black/[0.08] bg-white text-black/60 hover:border-primarypurple/30 hover:bg-primarypurple/[0.035] hover:text-primarypurple"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primarypurple"
                                                checked={checked}
                                                onChange={(e) => toggleTag(tag, e.target.checked)}
                                            />
                                            <span>{PROJECT_TAG_LABELS[tag]}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    }}
                />
                {errors.tags && (
                    <p id="edit-project-tags-error" className="text-xs font-medium text-red-600">
                        {errors.tags.message as string}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-black/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={updateMutation.isPending}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/[0.08] px-4 text-sm font-bold text-black/65 transition hover:border-primarypurple/15 hover:bg-primarypurple/[0.04] hover:text-primarypurple"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!isValid || isSubmitting || updateMutation.isPending}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primarypurple px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(76,41,178,0.16)] transition hover:bg-[#382080] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {updateMutation.isError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                    {(updateMutation.error as Error).message ||
                        "Failed to update project."}
                </p>
            )}
        </form>
    );
};

export default EditProjectForm;
