"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

const Users = () => {
    const [search, setSearch] = useState("");

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await authFetch("/api/users", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch users");
            }

            return res.json();
        },
    });

    const users = Array.isArray(data) ? data : [];

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user: any) => {
            const name = (user.full_name || "").toLowerCase();
            const email = (user.nu_email || "").toLowerCase();
            return name.includes(q) || email.includes(q);
        });
    }, [search, users]);

    const showEmptyState = !isLoading && !isError && filteredUsers.length === 0;

    return (
        <div className="p-6 px-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                    All the FORKED FASTians
                </h1>

                {/* Search */}
                <div className="w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Search by name or NU email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80 focus:ring-0"
                    />
                </div>
            </div>

            {/* Error state */}
            {isError && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {(error as Error)?.message || "Failed to load users."}
                </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="flex gap-4 rounded border border-primarypurple/10 bg-primarypurple/5 p-3"
                        >
                            <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-300" />
                            <div className="flex flex-1 flex-col gap-2">
                                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-300" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {showEmptyState && (
                <p className="text-sm text-gray-600">
                    No users found matching your search.
                </p>
            )}

            {/* Users grid */}
            {!isLoading && !isError && filteredUsers.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map((user: any) => (
                        <Link
                            href={`/platform/users/${user.user_id}`}
                            key={user.user_id}
                            className="flex gap-4 rounded border border-primarypurple/20 bg-primarypurple/5 p-3 transition-all duration-200 hover:border-primarypurple/60 hover:bg-primarypurple/10"
                        >
                            <img
                                className="h-20 w-20 rounded-2xl object-cover"
                                src={user.avatar_url || "/default-profile.png"}
                                alt={user.full_name || "User profile picture"}
                            />
                            <div className="flex flex-col justify-center gap-1">
                                <h3 className="text-lg font-semibold">
                                    {user.full_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {user.nu_email}
                                </p>
                                {user.is_github_connected && user.github_username && (
                                    <Link href={`https://github.com/${user.github_username}`} className="text-xs text-gray-600">
                                        @{user.github_username}
                                    </Link>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;