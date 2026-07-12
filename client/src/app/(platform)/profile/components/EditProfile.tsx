"use client";

import React, { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores";
import { authFetch } from "@/lib/authFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserType } from "@/stores/auth/useAuthStore";
import { queryKeys } from "@/lib/queryKeys";
import { PLATFORM_INPUT_CLASS } from "@/lib/platformStyles";
import {
    AlertCircle,
    CheckCircle2,
    CircleUserRound,
    FileText,
    LoaderCircle,
    Plus,
    Save,
    Sparkles,
} from "lucide-react";

const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters long"),
    bio: z.string(),
    skills: z.array(z.string().min(1)).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

type ProfileUpdateResponse = {
    data: Pick<UserType, "full_name" | "bio" | "skills">;
    message?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;
    if (!e) return "Failed to update profile";

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

    return "Failed to update profile";
};

const EditProfile = () => {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        formState: { errors, isValid },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        mode: "onChange",
        defaultValues: {
            full_name: user?.full_name || "",
            bio: user?.bio || "",
            skills: user?.skills || [],
        },
    });

    const [skillInput, setSkillInput] = useState("");

    const getInputClass = (fieldError?: unknown) =>
        `${PLATFORM_INPUT_CLASS} ${fieldError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`;

    const updateProfileMutation = useMutation<ProfileUpdateResponse, unknown, ProfileForm>({
        mutationFn: async (data: ProfileForm) => {
            const res = await authFetch("/api/auth/update/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: data.full_name,
                    bio: data.bio,
                    skills: data.skills ?? [],
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
        onSuccess: async (maybeUser) => {
            if (maybeUser?.data) {
                updateUser({
                    full_name: maybeUser.data.full_name,
                    bio: maybeUser.data.bio,
                    skills: maybeUser.data.skills,
                });

                reset({
                    full_name: maybeUser.data.full_name || "",
                    bio: maybeUser.data.bio || "",
                    skills: maybeUser.data.skills || [],
                });
            } else {
                reset();
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.users }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.recommendedProjects,
                }),
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.allUserProjects,
                }),
                user
                    ? queryClient.invalidateQueries({
                        queryKey: queryKeys.user(user.user_id),
                    })
                    : Promise.resolve(),
            ]);
        },
    });

    const onSubmit = (data: ProfileForm) => {
        updateProfileMutation.mutate(data);
    };

    const skills = useWatch({ control, name: "skills" }) || [];

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (!trimmed) return;
        if (skills.includes(trimmed)) {
            setSkillInput("");
            return;
        }
        setValue("skills", [...skills, trimmed], { shouldValidate: true });
        setSkillInput("");
    };

    const removeSkill = (skill: string) => {
        const next = skills.filter((s) => s !== skill);
        setValue("skills", next, { shouldValidate: true });
    };

    const handleSkillKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
        e
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
        }
    };

    let message: string | null = null;
    let isError = false;

    if (updateProfileMutation.isError) {
        message = getErrorMessage(updateProfileMutation.error);
        isError = true;
    } else if (updateProfileMutation.isSuccess) {
        const result = updateProfileMutation.data as
            | { message?: string }
            | undefined;
        message = result?.message || "Profile updated successfully!";
        isError = false;
    }

    return (
        <section
            className="relative isolate my-6 overflow-hidden rounded-[2rem] border border-primarypurple/15 bg-[#fbfaff] p-5 shadow-[0_22px_70px_rgba(24,15,48,0.08)] sm:p-7 lg:p-8"
            aria-labelledby="edit-profile-heading"
        >
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primarypurple via-primarygreen to-primarypurple"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-primarygreen/15 blur-3xl"
                aria-hidden="true"
            />

            <div className="mb-7 flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarypurple text-white shadow-[0_12px_28px_rgba(111,67,254,0.25)]">
                    <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primarypurple">
                        Public profile
                    </p>
                    <h2
                        id="edit-profile-heading"
                        className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl"
                    >
                        Edit your profile
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                        Help collaborators understand what you know, what you are
                        learning, and what you want to build.
                    </p>
                </div>
            </div>

            <form
                className="space-y-5"
                onSubmit={handleSubmit(onSubmit)}
                aria-busy={updateProfileMutation.isPending}
            >
                <div className="grid gap-5 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(24,15,48,0.04)] sm:p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    {/* Name */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="full_name"
                            className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"
                        >
                            <CircleUserRound
                                className="h-4 w-4 text-primarypurple"
                                aria-hidden="true"
                            />
                            Display name
                        </label>
                        <input
                            type="text"
                            id="full_name"
                            autoComplete="name"
                            disabled={updateProfileMutation.isPending}
                            aria-invalid={Boolean(errors.full_name)}
                            aria-describedby={
                                errors.full_name
                                    ? "edit-profile-name-error"
                                    : "edit-profile-name-help"
                            }
                            {...register("full_name")}
                            className={getInputClass(errors.full_name)}
                        />
                        <p
                            id="edit-profile-name-help"
                            className="mt-1.5 text-xs text-gray-500"
                        >
                            This is how your name appears across the platform.
                        </p>
                        {errors.full_name && (
                            <p
                                id="edit-profile-name-error"
                                className="mt-1.5 text-xs font-medium text-red-600"
                            >
                                {errors.full_name.message}
                            </p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="bio"
                            className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"
                        >
                            <FileText
                                className="h-4 w-4 text-primarypurple"
                                aria-hidden="true"
                            />
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            rows={4}
                            disabled={updateProfileMutation.isPending}
                            placeholder="What do you build, learn, or want to collaborate on?"
                            aria-invalid={Boolean(errors.bio)}
                            aria-describedby={
                                errors.bio
                                    ? "edit-profile-bio-error"
                                    : "edit-profile-bio-help"
                            }
                            {...register("bio")}
                            className={`${getInputClass(errors.bio)} min-h-28 resize-y py-3`}
                        />
                        <p
                            id="edit-profile-bio-help"
                            className="mt-1.5 text-xs text-gray-500"
                        >
                            A short introduction helps people know when to reach out.
                        </p>
                        {errors.bio && (
                            <p
                                id="edit-profile-bio-error"
                                className="mt-1.5 text-xs font-medium text-red-600"
                            >
                                {errors.bio.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Skills */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(24,15,48,0.04)] sm:p-5">
                    <div className="mb-3">
                        <p
                            id="edit-profile-skills-label"
                            className="flex items-center gap-2 text-sm font-bold text-gray-800"
                        >
                            <Sparkles
                                className="h-4 w-4 text-primarypurple"
                                aria-hidden="true"
                            />
                            Skills
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                            Add technologies and disciplines that describe your
                            strengths and interests.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="text"
                            placeholder="Type a skill and press Enter"
                            aria-labelledby="edit-profile-skills-label"
                            aria-describedby={
                                errors.skills
                                    ? "edit-profile-skills-error"
                                    : undefined
                            }
                            disabled={updateProfileMutation.isPending}
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            className={PLATFORM_INPUT_CLASS}
                        />
                        <Button
                            className="min-h-12 w-full bg-primarygreen px-6 font-black text-black shadow-[0_8px_20px_rgba(195,255,0,0.18)] sm:w-auto"
                            type="button"
                            isDisabled={
                                !skillInput.trim() ||
                                updateProfileMutation.isPending
                            }
                            onPress={addSkill}
                            startContent={
                                <Plus className="h-4 w-4" aria-hidden="true" />
                            }
                        >
                            Add skill
                        </Button>
                    </div>

                    <div
                        className="mt-4 flex min-h-10 flex-wrap items-center gap-2 rounded-xl border border-dashed border-primarypurple/20 bg-primarypurple/[0.025] p-3"
                        aria-label="Selected skills"
                    >
                        {skills.length > 0 ? (
                            skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    onClose={() => removeSkill(skill)}
                                    variant="flat"
                                    color="secondary"
                                    className="border border-primarypurple/15 bg-primarypurple/[0.08] font-bold text-primarypurple"
                                >
                                    {skill}
                                </Chip>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500">
                                No skills added yet. Start with the tools you use most.
                            </p>
                        )}
                    </div>

                    {errors.skills && (
                        <p
                            id="edit-profile-skills-error"
                            className="mt-2 text-xs font-medium text-red-600"
                        >
                            {errors.skills.message as string}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-black/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-gray-500">
                        Changes are visible to other signed-in community members.
                    </p>
                    <Button
                        className="min-h-12 w-full bg-primarypurple px-6 font-bold text-white shadow-[0_10px_26px_rgba(111,67,254,0.24)] sm:w-auto"
                        type="submit"
                        isDisabled={!isValid || updateProfileMutation.isPending}
                        startContent={
                            updateProfileMutation.isPending ? (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Save className="h-4 w-4" aria-hidden="true" />
                            )
                        }
                    >
                        {updateProfileMutation.isPending
                            ? "Saving..."
                            : "Save changes"}
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

export default EditProfile;
