"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Clock3,
    Inbox,
    MessageSquareText,
    Send,
    UserRoundCheck,
} from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { UserAvatar } from "../components/UserAvatar";
import { PlatformPageHeader } from "../components/PlatformPageHeader";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import {
    getCollaborationActions,
    getCollaborationDirection,
    type CollaborationAction,
    type CollaborationKind,
    type CollaborationStatus,
} from "@/lib/collaborationActions";
import {
    collaborationQueryKeys,
    notificationQueryKeys,
} from "@/lib/engagementQueryKeys";
import { readPaginatedArray } from "@/lib/pagination";
import { useAuthStore } from "@/stores";

type CollaborationRequestItem = {
    request_id: number;
    issue_id: number;
    issue_title: string;
    project_id: number;
    project_title: string;
    project_owner_id: number;
    user_id: number;
    user_full_name: string;
    user_nu_email: string;
    user_avatar_url: string | null;
    created_by_user_id: number;
    resolved_by_user_id: number | null;
    kind: CollaborationKind;
    status: CollaborationStatus;
    message: string;
    created_at: string;
    updated_at: string;
    responded_at: string | null;
};

type DashboardTab = "incoming" | "outgoing";

const pageSize = 20;
const collaborationSkeletonIds = ["one", "two", "three", "four"] as const;
const statusStyles: Record<CollaborationStatus, string> = {
    pending: "bg-amber-100 text-amber-800 ring-amber-200",
    accepted: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    rejected: "bg-red-100 text-red-700 ring-red-200",
    withdrawn: "bg-gray-100 text-gray-700 ring-gray-200",
    cancelled: "bg-gray-100 text-gray-700 ring-gray-200",
};
const actionLabels: Record<CollaborationAction, string> = {
    accept: "Accept",
    reject: "Reject",
    withdraw: "Withdraw",
    cancel: "Cancel",
};
const dashboardTabs = [
    { id: "incoming", label: "Incoming", Icon: Inbox },
    { id: "outgoing", label: "Outgoing", Icon: Send },
] as const;

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return `${date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    })} UTC`;
}

export default function CollaborationsPage() {
    const currentUser = useAuthStore((state) => state.user);
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<DashboardTab>("incoming");

    const requests = useInfiniteQuery({
        queryKey: collaborationQueryKeys.mine,
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(pageSize),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/collaboration-requests?${params}`,
                { signal }
            );
            if (!response.ok) {
                await readAuthResponse(
                    response,
                    "Unable to load collaboration requests."
                );
            }
            return readPaginatedArray<CollaborationRequestItem>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const actionMutation = useMutation({
        mutationFn: async ({
            requestId,
            action,
        }: {
            requestId: number;
            action: CollaborationAction;
        }) => {
            const response = await authFetch(
                `/api/collaboration-requests/${requestId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action }),
                }
            );
            return readAuthResponse<CollaborationRequestItem>(
                response,
                "Unable to update the collaboration request."
            );
        },
        onSuccess: async (result) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: collaborationQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: notificationQueryKeys.all,
                }),
                queryClient.invalidateQueries({ queryKey: ["projects"] }),
                result
                    ? queryClient.invalidateQueries({
                        queryKey: ["project", result.project_id],
                    })
                    : Promise.resolve(),
            ]);
        },
    });

    const allRequests = requests.data?.pages.flatMap((page) => page.items) ?? [];
    const visibleRequests = currentUser
        ? allRequests.filter(
            (request) =>
                getCollaborationDirection(request, currentUser.user_id) === activeTab
        )
        : [];
    const totalCount = requests.data?.pages[0]?.totalCount;

    if (!currentUser && (sessionStatus === "idle" || sessionStatus === "loading")) {
        return (
            <div className="mx-auto max-w-7xl space-y-4 px-5 py-8 sm:px-8 lg:py-12" role="status" aria-label="Loading collaborations">
                <div className="h-48 animate-pulse rounded-[2rem] bg-primarypurple/20" />
                <div className="h-40 animate-pulse rounded-[1.75rem] border border-black/[0.05] bg-white shadow-[0_18px_55px_rgba(42,25,86,0.06)]" />
            </div>
        );
    }

    return (
        <div className="px-5 py-8 sm:px-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-8">
            <PlatformPageHeader
                eyebrow="Build together"
                title={<>Collaboration <span className="text-primarygreen">desk.</span></>}
                description="Keep every request in one place, from the first invitation to the final decision."
                actions={
                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-white ring-1 ring-white/15">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarygreen/15 text-primarygreen">
                            <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold">Requests & invitations</span>
                    </div>
                }
            />

            <div role="group" aria-label="Collaboration request direction" className="flex w-full gap-1 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_10px_30px_rgba(42,25,86,0.06)] sm:w-fit">
                {dashboardTabs.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px sm:flex-none ${activeTab === id
                            ? "bg-primarypurple text-white shadow-[0_8px_20px_rgba(76,41,178,0.2)]"
                            : "text-black/60 hover:bg-primarypurple/[0.06] hover:text-primarypurple"
                            }`}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>

            {actionMutation.isError && (
                <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
                    {getAuthFormErrorMessage(
                        actionMutation.error,
                        "Unable to update the collaboration request."
                    )}
                </p>
            )}

            <section
                id="collaboration-request-panel"
                aria-label={`${activeTab} collaboration requests`}
                className="space-y-4"
            >
                {requests.isPending && (
                    <div className="space-y-3 rounded-[1.75rem] border border-black/[0.05] bg-white p-3 shadow-[0_16px_45px_rgba(42,25,86,0.05)]" role="status" aria-label="Loading collaboration requests">
                        {collaborationSkeletonIds.map((id) => (
                            <div
                                key={id}
                            className="h-44 animate-pulse rounded-2xl bg-[#f7f6fa]"
                            />
                        ))}
                    </div>
                )}

                {requests.isError && (
                    <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center">
                        <span>
                            {getAuthFormErrorMessage(
                                requests.error,
                                "Unable to load collaboration requests."
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={() => void requests.refetch()}
                            disabled={requests.isFetching}
                            className="min-h-11 rounded-xl px-3 font-bold underline transition hover:bg-red-100 disabled:opacity-60"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!requests.isPending && !requests.isError && visibleRequests.length === 0 && (
                    <div className="rounded-[1.75rem] border border-dashed border-primarypurple/25 bg-white p-10 text-center shadow-[0_16px_45px_rgba(42,25,86,0.05)]">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                            {activeTab === "incoming" ? (
                                <Inbox className="h-7 w-7" aria-hidden="true" />
                            ) : (
                                <Send className="h-7 w-7" aria-hidden="true" />
                            )}
                        </span>
                        <p className="mt-4 text-lg font-black tracking-[-0.02em]">No {activeTab} requests in the loaded results</p>
                        <p className="mt-1 text-sm text-gray-600">
                            {requests.hasNextPage
                                ? "Load more to check older requests."
                                : "New collaboration activity will appear here."}
                        </p>
                    </div>
                )}

                {visibleRequests.length > 0 && (
                    <>
                        <p className="px-1 text-xs font-medium text-black/60" aria-live="polite">
                            Loaded {allRequests.length}
                            {typeof totalCount === "number" ? ` of ${totalCount}` : ""} total requests
                        </p>
                        <div className="space-y-3 rounded-[1.75rem] border border-black/[0.06] bg-white p-3 shadow-[0_18px_55px_rgba(42,25,86,0.06)] sm:p-4">
                        {visibleRequests.map((request) => {
                            const actions = currentUser
                                ? getCollaborationActions(request, currentUser.user_id)
                                : [];
                            const pendingAction =
                                actionMutation.isPending &&
                                actionMutation.variables?.requestId === request.request_id;
                            return (
                                <article
                                    key={request.request_id}
                                    className="group relative space-y-5 overflow-hidden rounded-2xl border border-black/[0.045] bg-[#faf9fc] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primarypurple/15 hover:bg-white hover:shadow-[0_12px_30px_rgba(55,34,110,0.07)] active:translate-y-0 sm:p-6"
                                >
                                    {request.status === "pending" && (
                                        <span className="absolute inset-y-0 left-0 w-1 bg-primarygreen" aria-hidden="true" />
                                    )}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${statusStyles[request.status]}`}>
                                                    {request.status}
                                                </span>
                                                <span className="text-xs font-medium capitalize text-gray-500">
                                                    {request.kind}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/platform/projects/${request.project_id}`}
                                                className="mt-3 block text-xl font-black tracking-[-0.025em] text-gray-900 transition-colors hover:text-primarypurple focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primarypurple"
                                            >
                                                {request.project_title}
                                            </Link>
                                            <p className="text-sm text-gray-600">
                                                Issue: {request.issue_title}
                                            </p>
                                        </div>
                                        <time
                                            dateTime={request.created_at}
                                            className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500"
                                        >
                                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                            {formatDate(request.created_at)}
                                        </time>
                                    </div>

                                    <div className="rounded-2xl bg-primarypurple/[0.045] p-4 text-sm ring-1 ring-primarypurple/[0.08]">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <UserAvatar
                                                avatarUrl={request.user_avatar_url}
                                                name={request.user_full_name}
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate font-bold text-gray-900">
                                                    {request.user_full_name}
                                                </p>
                                                <p className="truncate text-gray-600">{request.user_nu_email}</p>
                                            </div>
                                        </div>
                                        {request.message && (
                                            <div className="mt-4 flex items-start gap-2 border-t border-black/[0.07] pt-4 text-gray-700">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primarypurple" aria-hidden="true" />
                                                <p className="whitespace-pre-wrap leading-6">
                                                    &ldquo;{request.message}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {actions.length > 0 && (
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {actions.map((action) => (
                                                <button
                                                    key={action}
                                                    type="button"
                                                    disabled={actionMutation.isPending}
                                                    onClick={() =>
                                                        actionMutation.mutate({
                                                            requestId: request.request_id,
                                                            action,
                                                        })
                                                    }
                                                    className={`min-h-11 rounded-xl px-5 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${action === "accept"
                                                        ? "bg-primarypurple text-white shadow-[0_8px_20px_rgba(76,41,178,0.16)] hover:bg-[#382080] focus-visible:outline-primarypurple"
                                                        : action === "reject"
                                                            ? "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600"
                                                            : "border border-black/[0.08] bg-white text-gray-700 hover:border-primarypurple/20 hover:bg-primarypurple/[0.05] hover:text-primarypurple focus-visible:outline-primarypurple"
                                                        }`}
                                                >
                                                    {pendingAction && actionMutation.variables?.action === action
                                                        ? "Updating..."
                                                        : actionLabels[action]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                        </div>
                    </>
                )}
            </section>

            {requests.hasNextPage && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => void requests.fetchNextPage()}
                        disabled={requests.isFetchingNextPage}
                        className="min-h-12 rounded-xl bg-primarypurple px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(76,41,178,0.18)] transition-colors hover:bg-[#382080] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px disabled:opacity-60"
                    >
                        {requests.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}
