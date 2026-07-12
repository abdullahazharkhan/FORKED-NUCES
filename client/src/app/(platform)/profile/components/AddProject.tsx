"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    FolderPlus,
    Github,
    LoaderCircle,
    Sparkles,
    Tags,
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { queryKeys } from "@/lib/queryKeys";
import { untrustedMarkdownProps } from "@/lib/markdownSecurity";
import { PLATFORM_INPUT_CLASS } from "@/lib/platformStyles";

const AVAILABLE_TAGS = [
    "frontend",
    "backend",
    "fullstack",
    "machine-learning",
    "devops",
    "mobile",
] as const;
type ProjectTag = (typeof AVAILABLE_TAGS)[number];

const projectSchema = z.object({
    title: z.string().min(1, "Project title is required"),
    description: z
        .string()
        .min(1, "Description is required")
        .max(10_000, "Description must be 10,000 characters or fewer"),
    github_url: z
        .string()
        .min(1, "GitHub URL is required")
        .url("Please enter a valid URL")
        .refine(
            (value) =>
                value.startsWith("https://github.com/") ||
                value.startsWith("https://www.github.com/") ||
                value.startsWith("http://github.com/"),
            "URL must be a GitHub repository or profile link"
        ),
    tags: z
        .array(z.enum(AVAILABLE_TAGS))
        .min(1, "Please select at least one tag"),
});

type ProjectForm = z.infer<typeof projectSchema>;

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;
    if (!e) return "Failed to create project";

    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const body = e.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];

        if (firstKey) {
            const value = body[firstKey];
            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }
            if (typeof value === "string") {
                return value;
            }
        }
    }

    if (typeof e.body === "string") return e.body;
    if (e.detail) return e.detail;
    if (e.message) return e.message;

    if (e.status) {
        return `${e.status} ${e.statusText || ""}`.trim();
    }

    return "Failed to create project";
};

const AddProject = () => {
    const queryClient = useQueryClient();
    const {
        register,
        control,
        handleSubmit,
        reset,
        clearErrors,
        formState: { errors, isValid, isDirty, isSubmitted },
    } = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
        mode: "onChange",
        defaultValues: {
            title: "",
            description: "",
            github_url: "",
            tags: [],
        },
    });

    const shouldShowError = (field: keyof ProjectForm) =>
        Boolean(errors[field] && (isDirty || isSubmitted));

    const getInputClass = (fieldError?: unknown) =>
        `${PLATFORM_INPUT_CLASS} ${fieldError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`;

    const createProjectMutation = useMutation({
        mutationFn: async (data: ProjectForm) => {
            const res = await authFetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    github_url: data.github_url,
                    tags: data.tags, // now an array of strings
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw {
                    status: res.status,
                    statusText: res.statusText,
                    body,
                } as ApiError;
            }

            return body;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
            ]);
            reset(
                {
                    title: "",
                    description: "",
                    github_url: "",
                    tags: [],
                },
                {
                    keepErrors: false,
                    keepDirty: false,
                    keepTouched: false,
                    keepIsSubmitted: false,
                    keepSubmitCount: false,
                    keepIsValid: false,
                }
            );
            clearErrors();
        },
    });

    const onSubmit = (data: ProjectForm) => {
        createProjectMutation.mutate(data);
    };

    let message: string | null = null;
    let isError = false;

    if (createProjectMutation.isError) {
        message = getErrorMessage(createProjectMutation.error);
        isError = true;
    } else if (createProjectMutation.isSuccess) {
        const result = createProjectMutation.data as { message?: string } | undefined;
        message = result?.message || "Project created successfully!";
        isError = false;
    }

    return (
        <section
            className="relative isolate my-6 overflow-hidden rounded-[2rem] border border-primarypurple/15 bg-[#fbfaff] p-5 shadow-[0_22px_70px_rgba(24,15,48,0.08)] sm:p-7 lg:p-8"
            aria-labelledby="add-project-heading"
        >
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primarypurple via-primarygreen to-primarypurple"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-primarypurple/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="mb-7 flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarypurple text-white shadow-[0_12px_28px_rgba(111,67,254,0.25)]">
                    <FolderPlus className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primarypurple">
                        Share your work
                    </p>
                    <h2
                        id="add-project-heading"
                        className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl"
                    >
                        Add a project
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                        Give your project a clear home so contributors can
                        discover it, understand it, and help move it forward.
                    </p>
                </div>
            </div>

            <form
                className="space-y-5"
                onSubmit={handleSubmit(onSubmit)}
                aria-busy={createProjectMutation.isPending}
            >
                <div className="grid gap-5 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(24,15,48,0.04)] sm:p-5 lg:grid-cols-2">
                    {/* Project Title */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="title"
                            className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"
                        >
                            <Sparkles
                                className="h-4 w-4 text-primarypurple"
                                aria-hidden="true"
                            />
                            Project title
                        </label>
                        <input
                            type="text"
                            id="title"
                            placeholder="e.g. Campus navigation app"
                            aria-invalid={shouldShowError("title")}
                            aria-describedby={
                                shouldShowError("title")
                                    ? "add-project-title-error"
                                    : "add-project-title-help"
                            }
                            {...register("title")}
                            className={getInputClass(errors.title)}
                        />
                        <p
                            id="add-project-title-help"
                            className="mt-1.5 text-xs text-gray-500"
                        >
                            Use a short, recognizable name.
                        </p>
                        {shouldShowError("title") && errors.title && (
                            <p
                                id="add-project-title-error"
                                className="mt-1.5 text-xs font-medium text-red-600"
                            >
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* GitHub URL */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="github_url"
                            className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"
                        >
                            <Github
                                className="h-4 w-4 text-primarypurple"
                                aria-hidden="true"
                            />
                            GitHub URL
                        </label>
                        <input
                            type="url"
                            id="github_url"
                            inputMode="url"
                            placeholder="https://github.com/you/project"
                            aria-invalid={shouldShowError("github_url")}
                            aria-describedby={
                                shouldShowError("github_url")
                                    ? "add-project-github-error"
                                    : "add-project-github-help"
                            }
                            {...register("github_url")}
                            className={getInputClass(errors.github_url)}
                        />
                        <p
                            id="add-project-github-help"
                            className="mt-1.5 text-xs text-gray-500"
                        >
                            Link directly to your public repository.
                        </p>
                        {shouldShowError("github_url") && errors.github_url && (
                            <p
                                id="add-project-github-error"
                                className="mt-1.5 text-xs font-medium text-red-600"
                            >
                                {errors.github_url.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description (Markdown editor) */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(24,15,48,0.04)] sm:p-5">
                    <p
                        id="add-project-description-label"
                        className="flex items-center gap-2 text-sm font-bold text-gray-800"
                    >
                        <FileText
                            className="h-4 w-4 text-primarypurple"
                            aria-hidden="true"
                        />
                        Project description
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                        Explain the problem, current progress, and how others can
                        contribute. Markdown is supported.
                    </p>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <div
                                role="group"
                                aria-labelledby="add-project-description-label"
                                aria-describedby={
                                    shouldShowError("description")
                                        ? "add-project-description-error"
                                        : undefined
                                }
                            >
                                <MdEditor
                                    {...untrustedMarkdownProps}
                                    editorId="add-project-description"
                                    language="en-US"
                                    modelValue={field.value || ""}
                                    onChange={field.onChange}
                                    className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white"
                                    theme="light"
                                    previewTheme="github"
                                    style={{ height: "320px" }}
                                />
                            </div>
                        )}
                    />
                    {shouldShowError("description") && errors.description && (
                        <p
                            id="add-project-description-error"
                            className="mt-2 text-xs font-medium text-red-600"
                        >
                            {errors.description.message}
                        </p>
                    )}
                </div>

                {/* Tags (multi-select, design only changed here) */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(24,15,48,0.04)] sm:p-5">
                    <p
                        id="add-project-tags-label"
                        className="flex items-center gap-2 text-sm font-bold text-gray-800"
                    >
                        <Tags
                            className="h-4 w-4 text-primarypurple"
                            aria-hidden="true"
                        />
                        Project tags
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                        Choose at least one area to help the right contributors
                        find your work.
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
                                    aria-labelledby="add-project-tags-label"
                                    aria-describedby={
                                        shouldShowError("tags")
                                            ? "add-project-tags-error"
                                            : undefined
                                    }
                                    className="mt-3 flex flex-wrap gap-2"
                                >
                                    {AVAILABLE_TAGS.map((tag) => {
                                        const checked = value.includes(tag);
                                        return (
                                            <label
                                                key={tag}
                                                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primarypurple ${checked
                                                    ? "border-primarypurple bg-primarypurple text-white shadow-[0_6px_16px_rgba(111,67,254,0.2)]"
                                                    : "border-black/10 bg-[#f8f7fb] text-gray-600 hover:border-primarypurple/30 hover:text-primarypurple"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-3.5 w-3.5 accent-primarypurple"
                                                    checked={checked}
                                                    onChange={(e) =>
                                                        toggleTag(tag, e.target.checked)
                                                    }
                                                />
                                                <span>{tag}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            );
                        }}
                    />
                    {shouldShowError("tags") && errors.tags && (
                        <p
                            id="add-project-tags-error"
                            className="mt-2 text-xs font-medium text-red-600"
                        >
                            {errors.tags.message as string}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-black/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-gray-500">
                        You can edit project details later from its project page.
                    </p>
                    <Button
                        className="min-h-12 w-full bg-primarypurple px-6 font-bold text-white shadow-[0_10px_26px_rgba(111,67,254,0.24)] sm:w-auto"
                        type="submit"
                        isDisabled={!isValid || createProjectMutation.isPending}
                        startContent={
                            createProjectMutation.isPending ? (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                            )
                        }
                    >
                        {createProjectMutation.isPending ? "Adding..." : "Add Project"}
                    </Button>
                </div>

                {message && (
                    <div
                        role={isError ? "alert" : "status"}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${isError
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700"
                            }`}
                    >
                        {isError ? (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>{message}</span>
                    </div>
                )}
            </form>
        </section>
    );
};

export default AddProject;
