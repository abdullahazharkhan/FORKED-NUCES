"use client";

import React from "react";
import { useAuthStore } from "@/stores";
import { Check } from "lucide-react";

const UserDetails = () => {
    const { user } = useAuthStore();
    const userSampleSkills = ["JavaScript", "React", "Node.js", "CSS", "HTML"];

    const displayName =
        user?.full_name?.trim().split(/\s+/).slice(0, 2).join(" ") || "John Doe";

    const email = user?.nu_email || "johndoe@example.com";

    const avatarInitial =
        user?.full_name?.trim().charAt(0)?.toUpperCase() || "U";

    return (
        <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
            <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex flex-col gap-4 min-[450px]:flex-row">
                    <div className="flex items-center justify-center">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="User Avatar"
                                className="h-24 w-24 rounded-xl object-cover md:h-28 md:w-28"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-300 text-3xl font-semibold text-white md:h-28 md:w-28">
                                {avatarInitial}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                        <h2 className="text-3xl font-semibold md:text-4xl">{displayName}</h2>
                        <p className="text-sm text-gray-600 md:text-base">{email}</p>

                        {user?.is_github_connected && user.github_username && (
                            <p className="text-sm text-green-600 md:text-base">
                                @{user.github_username}
                            </p>
                        )}

                        <div className="mt-2">
                            {user?.is_email_verified ? (
                                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white bg-primarypurple">
                                    Verified
                                    <Check className="ml-1 h-4 w-4" />
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white bg-red-500">
                                    Email Not Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 border-t border-primarypurple/20 pt-4 md:border-l-2 md:border-t-0 md:pl-6 md:pt-0">
                    <h3 className="text-lg font-semibold">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {userSampleSkills.map((skill, index) => (
                            <span
                                key={index}
                                className="rounded bg-primarypurple/20 px-3 py-1 text-xs text-gray-800"
                            >
                                {skill}
                            </span>
                        ))}
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
                        You don&apos;t have a bio yet.
                    </p>
                )}
            </div>
        </div>
    );
};

export default UserDetails;
