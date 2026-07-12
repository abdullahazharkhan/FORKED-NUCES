"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, RefreshCw, UsersRound } from "lucide-react";

import { UserAvatar } from "@/app/(platform)/components/UserAvatar";
import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;
const SKELETON_IDS = ["first", "second", "third"] as const;

type Collaborator = {
    avatar_url?: string | null;
    full_name: string;
    nu_email: string;
    user_id: number;
};

const ProjectCollaborators = ({ projectid }: { projectid: number }) => {
    const collaboratorsQuery = useInfiniteQuery<PaginatedPage<Collaborator>>({
        queryKey: queryKeys.projectCollaborators(projectid),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/projects/${projectid}/collaborators?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch collaborators");
            }
            return readPaginatedArray<Collaborator>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });
    const collaborators = useMemo(
        () =>
            collaboratorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [collaboratorsQuery.data]
    );
    const initialError =
        collaboratorsQuery.isError && collaborators.length === 0;

    return (
        <section
            className="relative isolate overflow-hidden rounded-[1.75rem] border border-primarypurple/15 bg-[#fbfaff] p-4 shadow-[0_18px_55px_rgba(24,16,54,0.07)] sm:p-6"
            aria-labelledby="project-collaborators-heading"
        >
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primarypurple via-primarygreen to-primarypurple"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-16 -top-16 -z-10 h-48 w-48 rounded-full bg-primarypurple/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primarypurple text-white shadow-[0_10px_24px_rgba(111,67,254,0.22)]">
                        <UsersRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primarypurple">
                            Project community
                        </p>
                        <h2
                            id="project-collaborators-heading"
                            className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl"
                        >
                            Collaborators
                        </h2>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-600">
                            Meet the people who have contributed through this
                            project&apos;s issues.
                        </p>
                    </div>
                </div>

                {!collaboratorsQuery.isPending && !initialError && (
                    <span className="w-fit rounded-full border border-primarypurple/15 bg-white px-3 py-1.5 text-xs font-bold text-primarypurple shadow-sm">
                        {collaborators.length.toLocaleString()} loaded
                    </span>
                )}
            </div>

            {collaboratorsQuery.isPending && (
                <div
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    role="status"
                    aria-label="Loading project collaborators"
                >
                    {SKELETON_IDS.map((id) => (
                        <div
                            key={id}
                            className="flex animate-pulse items-center gap-3 rounded-2xl border border-primarypurple/10 bg-white p-4"
                        >
                            <div className="h-11 w-11 shrink-0 rounded-full bg-primarypurple/10" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="h-3 w-2/3 rounded-full bg-gray-200" />
                                <div className="h-2.5 w-4/5 rounded-full bg-gray-100" />
                            </div>
                        </div>
                    ))}
                    <span className="sr-only">Loading collaborators...</span>
                </div>
            )}

            {initialError && (
                <div
                    className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
                    role="alert"
                >
                    <span>
                        {collaboratorsQuery.error instanceof Error
                            ? collaboratorsQuery.error.message
                            : "Failed to load collaborators."}
                    </span>
                    <button
                        type="button"
                        onClick={() => void collaboratorsQuery.refetch()}
                        disabled={collaboratorsQuery.isFetching}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-bold no-underline transition hover:border-red-300 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            )}

            {!collaboratorsQuery.isPending &&
                !initialError &&
                collaborators.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-primarypurple/25 bg-white/70 px-5 py-10 text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                            <UsersRound className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <p className="font-bold text-gray-900">
                            No collaborators yet
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-600">
                            Contributors will appear here after collaborating on
                            this project&apos;s issues.
                        </p>
                    </div>
                )}

            {collaborators.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {collaborators.map((collaborator) => (
                        <Link
                            href={`/platform/users/${collaborator.user_id}`}
                            key={collaborator.user_id}
                            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-[0_8px_24px_rgba(24,16,54,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-primarypurple/30 hover:shadow-[0_14px_32px_rgba(111,67,254,0.11)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                        >
                            <span className="shrink-0 rounded-full ring-2 ring-primarypurple/10 ring-offset-2 transition group-hover:ring-primarypurple/25">
                                <UserAvatar
                                    avatarUrl={collaborator.avatar_url ?? null}
                                    name={collaborator.full_name}
                                />
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-bold text-gray-950">
                                    {collaborator.full_name || "Unnamed User"}
                                </span>
                                <span className="truncate text-xs text-gray-500">
                                    {collaborator.nu_email}
                                </span>
                            </span>
                            <ArrowRight
                                className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primarypurple"
                                aria-hidden="true"
                            />
                        </Link>
                    ))}
                </div>
            )}

            {collaboratorsQuery.isFetchNextPageError && (
                <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row" role="alert">
                    <span>Could not load more collaborators.</span>
                    <button
                        type="button"
                        onClick={() => void collaboratorsQuery.fetchNextPage()}
                        disabled={collaboratorsQuery.isFetchingNextPage}
                        className="rounded-lg px-2 py-1 font-bold underline underline-offset-2 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {collaboratorsQuery.hasNextPage &&
                !collaboratorsQuery.isFetchNextPageError && (
                    <div className="mt-5 flex justify-center">
                        <button
                            type="button"
                            onClick={() => void collaboratorsQuery.fetchNextPage()}
                            disabled={collaboratorsQuery.isFetchingNextPage}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(111,67,254,0.2)] transition hover:-translate-y-0.5 hover:bg-[#5e32f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            {collaboratorsQuery.isFetchingNextPage && (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {collaboratorsQuery.isFetchingNextPage
                                ? "Loading..."
                                : "Load more collaborators"}
                        </button>
                    </div>
                )}
        </section>
    );
};

export default ProjectCollaborators;
