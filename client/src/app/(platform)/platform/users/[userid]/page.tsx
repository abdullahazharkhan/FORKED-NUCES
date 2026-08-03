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
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-8 lg:gap-9 lg:py-10">
            <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-primarygreen/[0.07] blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 top-80 -z-10 h-72 w-72 rounded-full bg-primarypurple/[0.07] blur-3xl" aria-hidden="true" />
            <Link
                href="/platform/users"
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-black/[0.06] bg-white/85 px-4 text-sm font-bold text-black/55 shadow-[0_6px_20px_rgba(24,15,48,0.05)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-primarypurple/20 hover:text-primarypurple hover:shadow-[0_9px_24px_rgba(24,15,48,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to people
            </Link>

            {isLoading && (
                <div className="relative isolate animate-pulse space-y-7 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#754cf2] via-primarypurple to-[#4520a8] p-6 shadow-[0_24px_70px_rgba(45,19,118,0.2)] sm:p-9" role="status" aria-label="Loading member profile">
                    <div className="landing-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="h-32 w-32 rounded-[1.75rem] bg-white/15" />
                        <div className="flex flex-1 flex-col gap-3">
                            <div className="h-3 w-24 rounded-xl bg-primarygreen/35" />
                            <div className="h-9 w-56 max-w-full rounded-xl bg-white/20" />
                            <div className="h-4 w-64 max-w-full rounded-xl bg-white/10" />
                            <div className="mt-2 h-7 w-28 rounded-xl bg-primarygreen/30" />
                        </div>
                    </div>
                    <div className="relative space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.06] p-5">
                        <div className="h-3 w-20 rounded-xl bg-primarygreen/30" />
                        <div className="h-4 w-full rounded-xl bg-white/10" />
                        <div className="h-4 w-3/4 rounded-xl bg-white/10" />
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
