"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowUpRight, Github, Search, UsersRound, X } from "lucide-react";

import { PlatformPageHeader } from "../../components/PlatformPageHeader";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_HEADER_BADGE_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SELECT_CLASS,
} from "@/lib/platformStyles";
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
    const hasActiveFilters =
        search.length > 0 || skill.length > 0 || ordering !== "name";

    const clearFilters = () => {
        setSearch("");
        setSkill("");
        setOrdering("name");
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 px-5 py-8 sm:px-8 lg:space-y-9 lg:py-10">
            <PlatformPageHeader
                eyebrow="Meet the community"
                title={<>Find people who <span className="text-primarygreen">build like you.</span></>}
                description="Discover FASTians by name, university email, or skill and connect through the projects they care about."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <UsersRound className="h-6 w-6 text-primarygreen" aria-hidden="true" />
                        <span className="text-sm font-bold">
                            {typeof totalCount === "number" ? totalCount : users.length} contributors
                        </span>
                    </div>
                }
            />

            <section className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_18px_60px_rgba(24,15,48,0.06)] sm:p-6" aria-labelledby="people-filter-heading">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 id="people-filter-heading" className="text-base font-black">Search the community</h2>
                        <p className="mt-1 text-xs text-black/45">Use a skill such as React, Django, or machine learning.</p>
                    </div>
                    {hasActiveFilters && (
                        <button type="button" onClick={clearFilters} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-black/50 transition hover:bg-black/[0.04] hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15">
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Clear filters
                        </button>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold text-black/55">Name or NU email</span>
                        <span className="relative block">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" aria-hidden="true" />
                            <input
                                id="user-search"
                                type="search"
                                placeholder="Search people"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className={`${PLATFORM_INPUT_CLASS} pl-11`}
                            />
                        </span>
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold text-black/55">Skill</span>
                        <input
                            id="user-skill-filter"
                            type="search"
                            placeholder="e.g. Python"
                            value={skill}
                            onChange={(event) => setSkill(event.target.value)}
                            className={PLATFORM_INPUT_CLASS}
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold text-black/55">Sort by</span>
                        <select
                            id="user-ordering"
                            value={ordering}
                            onChange={(event) => setOrdering(event.target.value as UserOrdering)}
                            className={PLATFORM_SELECT_CLASS}
                        >
                            <option value="name">Name</option>
                            <option value="newest">Newest members</option>
                            <option value="oldest">Oldest members</option>
                        </select>
                    </label>
                </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primarypurple">People directory</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Community members</h2>
                </div>
                <p className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black/50 shadow-sm" role="status" aria-live="polite">
                    {isDebouncing || (isFetching && !isFetchingNextPage)
                        ? "Updating user results..."
                        : totalCount !== null && totalCount !== undefined
                            ? `Showing ${users.length} of ${totalCount} people.`
                            : `${users.length} people loaded.`}
                </p>
            </div>

            {initialError && (
                <div
                    className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
                    role="alert"
                >
                    <span>{(error as Error)?.message || "Failed to load users."}</span>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="min-h-10 rounded-xl border border-red-300 bg-white px-4 font-bold hover:bg-red-100 disabled:opacity-60"
                    >
                        {isFetching ? "Retrying..." : "Try again"}
                    </button>
                </div>
            )}

            {isPending && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading people">
                    {USER_SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="flex min-h-[180px] animate-pulse gap-4 rounded-3xl border border-black/[0.06] bg-white p-5"
                        >
                            <div className="h-20 w-20 rounded-2xl bg-black/10" />
                            <div className="flex flex-1 flex-col gap-2">
                                <div className="h-5 w-2/3 rounded bg-black/10" />
                                <div className="h-3 w-1/2 rounded bg-black/[0.06]" />
                                <div className="mt-4 h-7 w-1/3 rounded-full bg-primarypurple/10" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showEmptyState && (
                <div className="rounded-3xl border border-dashed border-primarypurple/25 bg-white px-6 py-14 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/[0.08] text-primarypurple">
                        <UsersRound className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-xl font-black tracking-tight">No people match these filters</h2>
                    <p className="mt-2 text-sm text-black/50">Try another name or use a broader skill.</p>
                </div>
            )}

            {!isPending && !initialError && users.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {users.map((user) => (
                        <article
                            key={user.user_id}
                            className="group flex min-h-[190px] flex-col rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_16px_45px_rgba(24,15,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-primarypurple/25 hover:shadow-[0_24px_60px_rgba(58,35,126,0.13)]"
                        >
                            <Link
                                href={`/platform/users/${user.user_id}`}
                                className="flex gap-4 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/20"
                            >
                                {user.avatar_url ? (
                                    <Image
                                        loader={passthroughImageLoader}
                                        unoptimized
                                        className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-primarypurple/[0.07]"
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
                                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primarypurple/[0.09] text-2xl font-black text-primarypurple ring-4 ring-primarypurple/[0.05]"
                                        aria-hidden="true"
                                    >
                                        {(user.full_name || user.nu_email || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                    <span className="flex items-start justify-between gap-2">
                                        <h2 className="truncate text-lg font-black tracking-tight transition-colors group-hover:text-primarypurple">
                                            {user.full_name || "FASTian"}
                                        </h2>
                                        <ArrowUpRight className="h-4 w-4 shrink-0 text-black/25 transition group-hover:text-primarypurple" aria-hidden="true" />
                                    </span>
                                    <p className="truncate text-sm text-black/45">
                                        {user.nu_email}
                                    </p>
                                    {user.skills && user.skills.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {user.skills.slice(0, 2).map((item) => (
                                                <span key={item} className="rounded-full bg-primarypurple/[0.08] px-2 py-1 text-[0.65rem] font-bold text-primarypurple">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            {user.is_github_connected && user.github_username && (
                                <a
                                    href={`https://github.com/${encodeURIComponent(user.github_username)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg pt-4 text-xs font-bold text-black/45 transition hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
                                >
                                    <Github className="h-3.5 w-3.5" aria-hidden="true" />
                                    @{user.github_username}
                                </a>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {isFetchNextPageError && (
                <div
                    className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                >
                    <span>Could not load more users.</span>
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        className="font-bold underline underline-offset-4"
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
                        className={PLATFORM_PRIMARY_BUTTON_CLASS}
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load more users"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Users;
