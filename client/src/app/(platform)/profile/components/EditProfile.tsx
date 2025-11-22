"use client";

import React, { useState } from "react";
import { Button, Chip, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores";

const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters long"),
    bio: z.string(),
    skills: z
        .array(z.string().min(1)).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const EditProfile = () => {
    const user = useAuthStore((state) => state.user);
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors, isValid, isSubmitting },
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

    const onSubmit = (data: ProfileForm) => {
        // TODO: wire this up to your update-profile API
        console.log("Update profile payload", data);
    };

    const skills = watch("skills") || [];

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
        e,
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6 my-6">
            <h1 className="text-3xl font-semibold md:text-4xl underline decoration-primarypurple decoration-4">
                Edit Profile
            </h1>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="flex flex-col">
                    <label htmlFor="full_name" className="font-semibold text-lg">
                        Name
                    </label>
                    <input
                        type="text"
                        id="full_name"
                        {...register("full_name")}
                        className={getInputClass(errors.full_name)}
                    />
                    {errors.full_name && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.full_name.message}
                        </p>
                    )}
                </div>

                {/* Bio */}
                <div className="flex flex-col">
                    <label htmlFor="bio" className="font-semibold text-lg">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        rows={4}
                        {...register("bio")}
                        className={getInputClass(errors.bio)}
                    />
                    {errors.bio && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.bio.message}
                        </p>
                    )}
                </div>

                {/* Skills */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-lg">Skills</label>
                    <div className="flex gap-2">
                        <Input
                            size="sm"
                            variant="bordered"
                            placeholder="Type a skill and press Enter or Add"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            className="max-w-xs"
                        />
                        <Button
                            size="sm"
                            className="bg-primarygreen text-black font-bold"
                            type="button"
                            onPress={addSkill}
                        >
                            Add
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                            <Chip
                                key={skill}
                                onClose={() => removeSkill(skill)}
                                variant="flat"
                                color="secondary"
                                className="bg-primarypurple/20 text-primarypurple border border-primarypurple/40"
                            >
                                {skill}
                            </Chip>
                        ))}
                    </div>

                    {errors.skills && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.skills.message as string}
                        </p>
                    )}
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;