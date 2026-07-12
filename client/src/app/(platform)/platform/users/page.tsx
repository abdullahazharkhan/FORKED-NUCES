"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import { queryKeys } from "@/lib/queryKeys";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { UserType } from "@/stores/auth/useAuthStore";

const PAGE_SIZE = 24;
const USER_SKELETON_IDS = ["one", "two", "three", "four", "five", "six"] as const;
type UserOrdering = "name" | "newest" | "oldest";

const Users = () => {
    const [search, setSearch] = useState("");
    const [skill, setSkill] = useState("");
    const [ordering, setOrdering] = useState<UserOrdering>("name");
    const debouncedSearch = useDebouncedValue(search.trim(), 350);
    const debouncedSkill = useDebouncedValue(skill.trim(), 350);

    const filters = useMemo(
        () => ({
            limit: PAGE_SIZE,
            ordering,
            search: debouncedSearch,
            skill: debouncedSkill,
        }),
        [debouncedSearch, debouncedSkill, ordering]
    );

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isError,
        isFetchNextPageError,
        isFetching,
        isFetchingNextPage,
        isPending,
        refetch,
    } = useInfiniteQuery<PaginatedPage<UserType>>({
        queryKey: queryKeys.userList(filters),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
                ordering,
            });
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (debouncedSkill) params.set("skill", debouncedSkill);

            const response = await authFetch(`/api/users?${params.toString()}`, {
                method: "GET",
                signal,
            });
            if (!response.ok) throw new Error("Failed to fetch users");
            return readPaginatedArray<UserType>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const users = useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data]
    );
    const totalCount = data?.pages[0]?.totalCount;
    const initialError = isError && users.length === 0;
    const showEmptyState = !isPending && !initialError && users.length === 0;
    const isDebouncing =
        search.trim() !== debouncedSearch || skill.trim() !== debouncedSkill;

    return (
        <div className="space-y-6 p-6 px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <h1 className="text-4xl font-semibold underline decoration-4 decoration-primarypurple">
                    All the FORKED FASTians
                </h1>

                <div className="grid w-full gap-2 sm:grid-cols-3 xl:max-w-3xl">
                    <label className="sr-only" htmlFor="user-search">
                        Search users
                    </label>
                    <input
                        id="user-search"
                        type="search"
                        placeholder="Search by name or NU email"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    />

                    <label className="sr-only" htmlFor="user-skill-filter">
                        Filter users by skill
                    </label>
                    <input
                        id="user-skill-filter"
                        type="search"
                        placeholder="Filter by skill"
                        value={skill}
                        onChange={(event) => setSkill(event.target.value)}
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    />

                    <label className="sr-only" htmlFor="user-ordering">
                        Sort users
                    </label>
                    <select
                        id="user-ordering"
                        value={ordering}
                        onChange={(event) =>
                            setOrdering(event.target.value as UserOrdering)
                        }
                        className="w-full rounded border-2 border-gray-300 p-2 text-sm outline-none transition-colors duration-200 focus:border-primarypurple/80"
                    >
                        <option value="name">Name</option>
                        <option value="newest">Newest members</option>
                        <option value="oldest">Oldest members</option>
                    </select>
                </div>
            </div>

            <p className="text-sm text-gray-600" role="status" aria-live="polite">
                {isDebouncing || (isFetching && !isFetchingNextPage)
                    ? "Updating user results..."
                    : totalCount !== null && totalCount !== undefined
                        ? `Showing ${users.length} of ${totalCount} users.`
                        : `${users.length} users loaded.`}
            </p>

            {initialError && (
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>{(error as Error)?.message || "Failed to load users."}</span>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="rounded border border-red-300 bg-white px-3 py-1 font-semibold hover:bg-red-100 disabled:opacity-60"
                    >
                        {isFetching ? "Retrying..." : "Try again"}
                    </button>
                </div>
            )}

            {isPending && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {USER_SKELETON_IDS.map((id) => (
                        <div
                            key={id}
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

            {showEmptyState && (
                <p className="text-sm text-gray-600">
                    No users found matching the current filters.
                </p>
            )}

            {!isPending && !initialError && users.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <article
                            key={user.user_id}
                            className="flex flex-col rounded border border-primarypurple/20 bg-primarypurple/5 p-3 transition-all duration-200 hover:border-primarypurple/60 hover:bg-primarypurple/10"
                        >
                            <Link
                                href={`/platform/users/${user.user_id}`}
                                className="flex gap-4"
                            >
                                {user.avatar_url ? (
                                    <Image
                                        loader={passthroughImageLoader}
                                        unoptimized
                                        className="h-20 w-20 rounded-2xl object-cover"
                                        src={user.avatar_url}
                                        alt={
                                            user.full_name ||
                                            "User profile picture"
                                        }
                                        width={80}
                                        height={80}
                                    />
                                ) : (
                                    <div
                                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primarypurple/20 text-2xl font-bold text-primarypurple"
                                        aria-hidden="true"
                                    >
                                        {(user.full_name || user.nu_email || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-col justify-center gap-1">
                                    <h2 className="truncate text-lg font-semibold">
                                        {user.full_name}
                                    </h2>
                                    <p className="truncate text-sm text-gray-600">
                                        {user.nu_email}
                                    </p>
                                </div>
                            </Link>
                            {user.is_github_connected && user.github_username && (
                                <a
                                    href={`https://github.com/${encodeURIComponent(user.github_username)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 w-fit text-xs text-gray-600 underline hover:text-primarypurple"
                                >
                                    @{user.github_username}
                                </a>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {isFetchNextPageError && (
                <div
                    className="flex items-center justify-center gap-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more users.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {hasNextPage && !initialError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-xl bg-black px-6 py-2 font-semibold text-white hover:bg-black/80 disabled:opacity-60"
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load more users"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Users;
