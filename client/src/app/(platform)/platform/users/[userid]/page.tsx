"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import UserProjects from "../components/UserProjects";
import UserDetails from "@/app/(platform)/profile/components/UserDetails";
import UserCollaborations from "../components/UserCollaborations";
import { queryKeys } from "@/lib/queryKeys";
import { HttpResponseError, isNotFoundError } from "@/lib/httpError";
import { RetryAlert } from "@/app/(platform)/components/RetryAlert";

const User = ({ params }: { params: Promise<{ userid: string }> }) => {
    const { userid } = React.use(params);
    const userIdNumber = Number(userid);
    const hasValidUserId =
        Number.isSafeInteger(userIdNumber) && userIdNumber > 0;

    const {
        data: user,
        isLoading,
        isError,
        isFetching,
        error,
        refetch,
    } = useQuery({
        queryKey: queryKeys.user(userid),
        queryFn: async ({ signal }) => {
            const res = await authFetch(`/api/users/${userid}`, {
                method: "GET",
                signal,
            });

            if (!res.ok) {
                throw new HttpResponseError("Failed to fetch user", res.status);
            }

            return res.json();
        },
        enabled: hasValidUserId,
        retry: (failureCount, queryError) =>
            !isNotFoundError(queryError) && failureCount < 3,
    });

    if (!hasValidUserId || isNotFoundError(error)) notFound();

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-8 lg:gap-9 lg:py-10">
            <Link
                href="/platform/users"
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 text-sm font-bold text-black/55 shadow-sm transition hover:-translate-y-0.5 hover:border-primarypurple/30 hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to people
            </Link>

            {isLoading && (
                <div className="relative isolate animate-pulse space-y-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4820c7] via-primarypurple to-[#5225cf] p-6 sm:p-9" role="status" aria-label="Loading member profile">
                    <div className="landing-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="h-32 w-32 rounded-[1.75rem] bg-white/15" />
                        <div className="flex flex-1 flex-col gap-3">
                            <div className="h-3 w-24 rounded bg-primarygreen/35" />
                            <div className="h-9 w-56 max-w-full rounded bg-white/20" />
                            <div className="h-4 w-64 max-w-full rounded bg-white/10" />
                            <div className="mt-2 h-7 w-28 rounded-full bg-primarygreen/30" />
                        </div>
                    </div>
                    <div className="relative space-y-3 border-t border-white/15 pt-6">
                        <div className="h-3 w-20 rounded bg-primarygreen/30" />
                        <div className="h-4 w-full rounded bg-white/10" />
                        <div className="h-4 w-3/4 rounded bg-white/10" />
                    </div>
                </div>
            )}

            {isError && (
                <RetryAlert
                    error={error}
                    fallbackMessage="Failed to load user."
                    isRetrying={isFetching}
                    onRetry={() => void refetch()}
                />
            )}

            {!isLoading && user && (
                <>
                    <UserDetails user={user} page="userDetails" />
                    <UserProjects userid={userid} />
                    <UserCollaborations userid={userid} />
                </>
            )}
        </div>
    );
};

export default User;
