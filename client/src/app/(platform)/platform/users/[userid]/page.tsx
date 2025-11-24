"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import "md-editor-rt/lib/style.css";
import { authFetch } from "@/lib/authFetch";
import UserProjects from "../components/UserProjects";
import UserDetails from "@/app/(platform)/profile/components/UserDetails";

const User = ({ params }: { params: Promise<{ userid: string }> }) => {
    const { userid } = React.use(params);

    const {
        data: user,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["user", userid],
        queryFn: async () => {
            const res = await authFetch(`/api/users/${userid}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch user");
            }

            return res.json();
        },
    });

    return (
        <div className="mt-6 flex flex-col gap-6 p-6">
            {isLoading && (
                <div className="space-y-6 rounded-xl border border-gray-200 bg-primarypurple/5 p-6 animate-pulse">
                    <div className="flex flex-col gap-6 md:flex-row">
                        {/* Avatar skeleton */}
                        <div className="h-28 w-28 rounded-xl bg-gray-300"></div>

                        <div className="flex flex-col gap-3 flex-1">
                            <div className="h-6 w-40 bg-gray-300 rounded"></div>
                            <div className="h-4 w-60 bg-gray-200 rounded"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>

                            <div className="h-4 w-24 bg-gray-300 rounded mt-2"></div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <div className="h-6 w-16 rounded bg-gray-300"></div>
                        <div className="h-6 w-20 rounded bg-gray-300"></div>
                        <div className="h-6 w-12 rounded bg-gray-300"></div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                        <div className="h-5 w-32 bg-gray-300 rounded"></div>
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                </div>
            )}

            {isError && (
                <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
                    {(error as Error)?.message || "Failed to load user."}
                </div>
            )}

            {!isLoading && !isError && user && (
                <>
                    <UserDetails user={user} page="userDetails" />
                    <div className="border-t-2 border-primarypurple/20"></div>
                    <UserProjects userid={userid} />
                </>
            )
            }
        </div >
    );
};

export default User;
