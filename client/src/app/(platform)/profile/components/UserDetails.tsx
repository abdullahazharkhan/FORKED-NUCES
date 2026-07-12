"use client";

import React from "react";
import { useAuthStore } from "@/stores";
import { Check } from "lucide-react";
import Image from "next/image";

import type { UserType } from "@/stores/auth/useAuthStore";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import { ReportButton } from "@/app/(platform)/components/ReportButton";

type UserDetailsProps = {
    page: "profile" | "userDetails";
    user?: UserType;
};

const UserDetails = ({ user: propUser, page }: UserDetailsProps) => {
    const storeUser = useAuthStore((s) => s.user);
    const sessionStatus = useAuthStore((s) => s.sessionStatus);
    const user = propUser ?? storeUser;

    if (!user) {
        return (
            <div
                className="space-y-3 rounded-xl border border-gray-200 bg-primarypurple/5 p-6"
                role={
                    sessionStatus === "error" ||
                    sessionStatus === "unauthenticated"
                        ? "alert"
                        : "status"
                }
            >
                <div className="h-7 w-48 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                <p className="text-sm text-gray-600">
                    {sessionStatus === "error" ||
                    sessionStatus === "unauthenticated"
                        ? "Unable to load your profile."
                        : "Loading your profile…"}
                </p>
            </div>
        );
    }

    const displayName =
        user.full_name?.trim().split(/\s+/).slice(0, 2).join(" ") || "FASTian";

    const email = user.nu_email || "Email unavailable";

    const avatarInitial =
        user?.full_name?.trim().charAt(0)?.toUpperCase() || "U";
    const canReport =
        page === "userDetails" &&
        Boolean(storeUser) &&
        storeUser?.user_id !== user.user_id;

    return (
        <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
            {canReport && (
                <div className="flex justify-end">
                    <ReportButton
                        targetType="user"
                        targetId={user.user_id}
                        targetLabel={displayName}
                    />
                </div>
            )}
            <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex flex-col gap-4 min-[450px]:flex-row">
                    <div className="flex items-center justify-center">
                        {user?.avatar_url ? (
                            <Image
                                loader={passthroughImageLoader}
                                unoptimized
                                src={user.avatar_url}
                                alt={`${displayName} avatar`}
                                width={112}
                                height={112}
                                className="h-24 w-24 rounded-xl object-cover md:h-28 md:w-28"
                            />
                        ) : (
                            <div
                                className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-300 text-3xl font-semibold text-white md:h-28 md:w-28"
                                aria-hidden="true"
                            >
                                {avatarInitial}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                        <h1 className="text-3xl font-semibold md:text-4xl">
                            {displayName}
                        </h1>
                        <p className="text-sm text-gray-600 md:text-base">{email}</p>

                        {user?.is_github_connected && user.github_username && (
                            <p className="text-sm text-green-600 md:text-base">
                                @{user.github_username}
                            </p>
                        )}

                        <div className="mt-2">
                            {user?.is_email_verified ? (
                                <span className="inline-flex items-center rounded bg-primarypurple px-2 py-0.5 text-xs font-medium text-white">
                                    Verified
                                    <Check className="ml-1 h-4 w-4" aria-hidden="true" />
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                    Email Not Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 border-t border-primarypurple/20 pt-4 md:border-l-2 md:border-t-0 md:pl-6 md:pt-0">
                    <h3 className="text-lg font-semibold">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {user?.skills && user.skills.length > 0 ? (
                            user.skills.map((skill: string) => (
                                <span
                                    key={skill}
                                    className="rounded bg-primarypurple/20 px-3 py-1 text-xs text-gray-800"
                                >
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-600">
                                {page === "profile" ? "Update the profile to set the skills." : "User has not added any skills yet."}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                {user?.bio ? (
                    <>
                        <h3 className="mb-1 text-lg font-semibold">About Me</h3>
                        <p className="text-sm leading-relaxed text-gray-700 md:text-base">
                            {user.bio}
                        </p>
                    </>
                ) : (
                    <p className="text-sm leading-relaxed text-gray-700 md:text-base">
                        {page === "profile"
                            ? "You don’t have a bio yet."
                            : "User has not added a bio yet."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default UserDetails;
