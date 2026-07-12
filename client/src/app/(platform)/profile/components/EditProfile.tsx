"use client";

import React, { useState } from "react";
import { Button, Chip, Input } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores";
import { authFetch } from "@/lib/authFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserType } from "@/stores/auth/useAuthStore";
import { queryKeys } from "@/lib/queryKeys";

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

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

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
        <div className="my-6 space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
            <h2 className="text-3xl font-semibold underline decoration-primarypurple decoration-4 md:text-4xl">
                Edit Profile
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="flex flex-col">
                    <label htmlFor="full_name" className="text-lg font-semibold">
                        Name
                    </label>
                    <input
                        type="text"
                        id="full_name"
                        aria-invalid={Boolean(errors.full_name)}
                        aria-describedby={
                            errors.full_name
                                ? "edit-profile-name-error"
                                : undefined
                        }
                        {...register("full_name")}
                        className={getInputClass(errors.full_name)}
                    />
                    {errors.full_name && (
                        <p id="edit-profile-name-error" className="mt-1 text-sm text-red-500">
                            {errors.full_name.message}
                        </p>
                    )}
                </div>

                {/* Bio */}
                <div className="flex flex-col">
                    <label htmlFor="bio" className="text-lg font-semibold">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        rows={4}
                        aria-invalid={Boolean(errors.bio)}
                        aria-describedby={
                            errors.bio ? "edit-profile-bio-error" : undefined
                        }
                        {...register("bio")}
                        className={getInputClass(errors.bio)}
                    />
                    {errors.bio && (
                        <p id="edit-profile-bio-error" className="mt-1 text-sm text-red-500">
                            {errors.bio.message}
                        </p>
                    )}
                </div>

                {/* Skills */}
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">Skills</p>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            size="sm"
                            variant="bordered"
                            placeholder="Type a skill and press Enter or Add"
                            aria-label="New skill"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            className="w-full"
                        />
                        <Button
                            size="sm"
                            className="w-full bg-primarygreen font-bold text-black sm:w-auto"
                            type="button"
                            isDisabled={!skillInput.trim()}
                            onPress={addSkill}
                        >
                            Add
                        </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <Chip
                                key={skill}
                                onClose={() => removeSkill(skill)}
                                variant="flat"
                                color="secondary"
                                className="border border-primarypurple/40 bg-primarypurple/20 text-primarypurple"
                            >
                                {skill}
                            </Chip>
                        ))}
                    </div>

                    {errors.skills && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.skills.message as string}
                        </p>
                    )}
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen font-bold text-black"
                        type="submit"
                        isDisabled={!isValid || updateProfileMutation.isPending}
                    >
                        {updateProfileMutation.isPending
                            ? "Saving..."
                            : "Save Changes"}
                    </Button>
                </div>

                {message && (
                    <div
                        role={isError ? "alert" : "status"}
                        className={`mt-4 rounded p-3 text-sm ${isError
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

export default EditProfile;
