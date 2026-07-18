"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowUpRight, Github, Search, UsersRound, X } from "lucide-react";

import { PlatformPageHeader } from "../../components/PlatformPageHeader";
import { RetryAlert } from "../../components/RetryAlert";
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

function userGridSpan(index: number) {
    return index % 4 === 0 || index % 4 === 3
        ? "xl:col-span-7"
        : "xl:col-span-5";
}

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
        <div className="mx-auto w-full max-w-[90rem] space-y-8 px-5 py-8 sm:px-8 lg:space-y-11 lg:py-12">
            <PlatformPageHeader
                eyebrow="Campus contributor index"
                title={<>Find the people behind <span className="text-primarygreen">the work.</span></>}
                description="Look up FASTians by name, university email, or craft, then trace the projects and problems they care about."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <UsersRound className="h-6 w-6 text-primarygreen" aria-hidden="true" />
                        <span className="font-mono text-[0.68rem] font-semibold uppercase leading-4 tracking-[0.1em] text-white/90">
                            <strong className="text-sm tabular-nums text-white">{typeof totalCount === "number" ? totalCount : users.length}</strong><br />contributors indexed
                        </span>
                    </div>
                }
            />

            <section className="border-y border-black/15 bg-white/75 px-5 py-6 sm:px-6" aria-labelledby="people-filter-heading">
                <div className="grid gap-7 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-0">
                    <div className="flex flex-col items-start justify-between gap-5 lg:pr-6">
                        <div>
                            <h2 id="people-filter-heading" className="text-base font-black tracking-[-0.02em]">Search the community</h2>
                            <p className="mt-2 max-w-[28ch] text-xs leading-5 text-black/60">Try a craft such as React, Django, or machine learning.</p>
                        </div>
                        {hasActiveFilters && (
                            <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1.5 border-b border-black/20 px-1 text-xs font-bold text-black/60 transition-colors hover:border-primarypurple hover:text-primarypurple active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple">
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Clear filters
                            </button>
                        )}
                    </div>
                    <div className="grid gap-5 border-black/10 sm:grid-cols-3 lg:border-l lg:pl-6">
                    <label className="block">
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Name or NU email</span>
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
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Skill</span>
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
                        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-black/60">Sort by</span>
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
                </div>
            </section>

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-5">
                <div>
                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primarypurple">Directory / people</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Community members</h2>
                </div>
                <p className="border-l-2 border-primarygreen pl-3 font-mono text-[0.68rem] font-medium tabular-nums text-black/60" role="status" aria-live="polite">
                    {isDebouncing || (isFetching && !isFetchingNextPage)
                        ? "Updating user results..."
                        : totalCount !== null && totalCount !== undefined
                            ? `Showing ${users.length} of ${totalCount} people.`
                            : `${users.length} people loaded.`}
                </p>
            </div>

            {initialError && (
                <RetryAlert
                    error={error}
                    fallbackMessage="Community members could not be loaded."
                    isRetrying={isFetching}
                    onRetry={() => void refetch()}
                />
            )}

            {isPending && (
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-12" role="status" aria-label="Loading people">
                    {USER_SKELETON_IDS.map((id, index) => (
                        <div
                            key={id}
                            className={`min-h-[13.5rem] animate-pulse border border-t-2 border-black/10 bg-white p-5 ${userGridSpan(index)}`}
                        >
                            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                                <div className="h-2.5 w-24 rounded-sm bg-primarypurple/10" />
                                <div className="h-7 w-7 rounded-sm bg-black/[0.06]" />
                            </div>
                            <div className="mt-5 flex gap-4">
                                <div className="h-20 w-20 shrink-0 rounded-lg bg-black/10" />
                                <div className="flex flex-1 flex-col gap-2 pt-1">
                                    <div className="h-5 w-2/3 rounded-sm bg-black/10" />
                                    <div className="h-3 w-1/2 rounded-sm bg-black/[0.06]" />
                                    <div className="mt-3 flex gap-2">
                                        <div className="h-6 w-20 rounded-full bg-primarypurple/10" />
                                        <div className="h-6 w-16 rounded-full bg-primarypurple/10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showEmptyState && (
                <div className="grid gap-6 border-y border-black/15 bg-white px-6 py-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-8 sm:py-12">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md border border-primarypurple/20 bg-primarypurple/[0.07] text-primarypurple">
                        <UsersRound className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primarypurple">Directory note / no matches</p>
                        <h2 className="mt-2 text-xl font-black tracking-[-0.03em]">No people match these filters</h2>
                        <p className="mt-2 text-sm text-black/60">Try another name or use a broader skill.</p>
                    </div>
                </div>
            )}

            {!isPending && !initialError && users.length > 0 && (
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-12">
                    {users.map((user, index) => (
                        <article
                            key={user.user_id}
                            className={`group relative flex min-h-[13.5rem] flex-col overflow-hidden border border-t-2 border-black/15 bg-white p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primarypurple/45 ${userGridSpan(index)}`}
                        >
                            <span className="absolute left-0 top-0 h-1 w-12 origin-left scale-x-0 bg-primarygreen transition-transform duration-200 group-hover:scale-x-100" aria-hidden="true" />
                            <Link
                                href={`/platform/users/${user.user_id}`}
                                className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primarypurple"
                            >
                                <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
                                    <p className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-primarypurple">
                                        Contributor / {String(index + 1).padStart(2, "0")}
                                    </p>
                                    <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-black/10 text-black/30 transition-colors group-hover:border-primarypurple/30 group-hover:text-primarypurple">
                                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                    </span>
                                </div>
                                <div className="mt-5 flex gap-4">
                                    {user.avatar_url ? (
                                        <Image
                                            loader={passthroughImageLoader}
                                            unoptimized
                                            className="h-20 w-20 shrink-0 rounded-lg border border-primarypurple/15 object-cover"
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
                                            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-primarypurple/15 bg-primarypurple/[0.08] font-mono text-2xl font-black text-primarypurple"
                                            aria-hidden="true"
                                        >
                                            {(user.full_name || user.nu_email || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                        <h2 className="truncate text-xl font-black tracking-[-0.035em] transition-colors group-hover:text-primarypurple">
                                            {user.full_name || "FASTian"}
                                        </h2>
                                        <p className="truncate font-mono text-[0.68rem] text-black/60">
                                            {user.nu_email}
                                        </p>
                                        {user.skills && user.skills.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {user.skills.slice(0, 3).map((item) => (
                                                    <span key={item} className="rounded-full border border-primarypurple/10 bg-primarypurple/[0.07] px-2 py-1 text-[0.65rem] font-bold text-primarypurple">
                                                        {item}
                                                    </span>
                                                ))}
                                                {user.skills.length > 3 && (
                                                    <span className="rounded-full border border-black/[0.06] bg-black/[0.04] px-2 py-1 text-[0.65rem] font-bold text-black/60">
                                                        +{user.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                            {user.is_github_connected && user.github_username && (
                                <a
                                    href={`https://github.com/${encodeURIComponent(user.github_username)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-auto inline-flex w-fit items-center gap-1.5 border-b border-transparent pt-4 font-mono text-[0.68rem] font-semibold text-black/60 transition-colors hover:border-primarypurple hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
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
                    className="flex flex-wrap items-center justify-center gap-3 border-y border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
