"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useMutation } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

const AVAILABLE_TAGS = [
    "frontend",
    "backend",
    "fullstack",
    "machine-learning",
    "devops",
    "mobile",
];

const projectSchema = z.object({
    title: z.string().min(1, "Project title is required"),
    description: z.string().min(1, "Description is required"),
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
        .array(z.enum(AVAILABLE_TAGS as [string, ...string[]]))
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
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isValid },
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

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"
        }`;

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
        onSuccess: () => {
            reset();
        },
        onError: (err) => {
            console.error("Create project error", err);
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
        <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6 my-6">
            <h1 className="text-3xl font-semibold md:text-4xl underline decoration-primarypurple decoration-4">
                Add Project
            </h1>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Project Title */}
                <div className="flex flex-col">
                    <label htmlFor="title" className="font-semibold text-lg">
                        Project Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        {...register("title")}
                        className={getInputClass(errors.title)}
                    />
                    {errors.title && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                {/* Description (Markdown editor) */}
                <div className="flex flex-col">
                    <label className="font-semibold text-lg">Description</label>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <MdEditor
                                language="en-US"
                                modelValue={field.value || ""}
                                onChange={field.onChange}
                                className="mt-2 rounded-xl border-2 border-primarypurple/30 bg-primarypurple/5"
                                theme="light"
                                previewTheme="github"
                                style={{ height: "320px" }}
                            />
                        )}
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                {/* GitHub URL */}
                <div className="flex flex-col">
                    <label htmlFor="github_url" className="font-semibold text-lg">
                        GitHub URL
                    </label>
                    <input
                        type="url"
                        id="github_url"
                        {...register("github_url")}
                        className={getInputClass(errors.github_url)}
                    />
                    {errors.github_url && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.github_url.message}
                        </p>
                    )}
                </div>

                {/* Tags (multi-select, design only changed here) */}
                <div className="flex flex-col">
                    <label className="font-semibold text-lg">Tags</label>
                    <Controller
                        control={control}
                        name="tags"
                        render={({ field }) => {
                            const value: string[] = field.value || [];
                            const toggleTag = (tag: string, checked: boolean) => {
                                if (checked) {
                                    field.onChange([...value, tag]);
                                } else {
                                    field.onChange(value.filter((t) => t !== tag));
                                }
                            };

                            return (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {AVAILABLE_TAGS.map((tag) => {
                                        const checked = value.includes(tag);
                                        return (
                                            <label
                                                key={tag}
                                                className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs ${checked
                                                    ? "border-primarypurple bg-primarypurple/15 text-primarypurple"
                                                    : "border-gray-300 text-gray-700"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-3 w-3 accent-primarypurple"
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
                    {errors.tags && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.tags.message as string}
                        </p>
                    )}
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || createProjectMutation.isPending}
                    >
                        {createProjectMutation.isPending ? "Adding..." : "Add Project"}
                    </Button>
                </div>

                {message && (
                    <div
                        className={`mt-4 p-3 rounded text-sm ${isError
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                            }`}
                    >
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddProject;
