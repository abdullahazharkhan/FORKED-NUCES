"use client";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdEditor } from "md-editor-rt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { useRouter } from "next/navigation";

const AVAILABLE_TAGS = [
    "frontend",
    "backend",
    "fullstack",
    "machine-learning",
    "devops",
    "mobile",
];

const editProjectSchema = z.object({
    title: z.string().min(1, "Title is required"),
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
        .min(1, "Select at least one tag"),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
    project: any;
    onClose: () => void;
}

const EditProjectForm: React.FC<EditProjectFormProps> = ({ project, onClose }) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const defaultTags: string[] = Array.isArray(project.tags)
        ? project.tags
            .map((t: any) => t.tag)
            .filter((t: string) => AVAILABLE_TAGS.includes(t))
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
                queryKey: ["project", String(project.project_id)],
            });

            onClose();
        },
    });

    const onSubmit = (data: EditProjectFormValues) => {
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
                <label className="text-sm font-semibold" htmlFor="title">
                    Title
                </label>
                <input
                    id="title"
                    type="text"
                    {...register("title")}
                    className={getInputClass(errors.title)}
                />
                {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
            </div>

            {/* Description (Markdown) */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold">Description</label>
                <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <div className="mt-1 rounded-xl border-2 border-primarypurple/30 bg-white">
                            <MdEditor
                                language="en-US"
                                modelValue={field.value}
                                onChange={field.onChange}
                                previewTheme="github"
                                style={{ height: "160px" }}
                            />
                        </div>
                    )}
                />
                {errors.description && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.description.message}
                    </p>
                )}
            </div>

            {/* GitHub URL */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold" htmlFor="github_url">
                    GitHub URL
                </label>
                <input
                    id="github_url"
                    type="url"
                    {...register("github_url")}
                    className={getInputClass(errors.github_url)}
                />
                {errors.github_url && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.github_url.message}
                    </p>
                )}
            </div>

            {/* Tags (multi-select from allowed list) */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold">Tags</label>
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
                            <div className="mt-1 flex flex-wrap gap-2">
                                {AVAILABLE_TAGS.map((tag) => {
                                    const checked = value.includes(tag);
                                    return (
                                        <label
                                            key={tag}
                                            className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs ${checked
                                                ? "border-primarypurple bg-primarypurple/15 text-primarypurple"
                                                : "border-gray-300 bg-white text-gray-700"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-3 w-3 accent-primarypurple"
                                                checked={checked}
                                                onChange={(e) => toggleTag(tag, e.target.checked)}
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
                    <p className="mt-1 text-xs text-red-500">
                        {errors.tags.message as string}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!isValid || isSubmitting || updateMutation.isPending}
                    className="rounded-lg bg-primarypurple px-4 py-2 text-sm font-semibold text-white hover:bg-primarypurple/90 disabled:opacity-60 transition"
                >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {updateMutation.isError && (
                <p className="mt-2 text-xs text-red-600">
                    {(updateMutation.error as Error).message ||
                        "Failed to update project."}
                </p>
            )}
        </form>
    );
};

export default EditProjectForm;
