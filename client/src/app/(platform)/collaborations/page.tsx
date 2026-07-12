"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Send, UserRoundCheck } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    withdrawn: "bg-gray-100 text-gray-700",
    cancelled: "bg-gray-100 text-gray-700",
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
            <div className="mx-auto max-w-5xl space-y-4 px-5 py-8 sm:px-8" role="status">
                <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
                <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
            <header>
                <h1 className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
                    <UserRoundCheck className="h-8 w-8 text-primarypurple" aria-hidden="true" />
                    Collaborations
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Review applications you received and invitations or applications you sent.
                </p>
            </header>

            <div role="group" aria-label="Collaboration request direction" className="flex gap-2">
                {dashboardTabs.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === id
                            ? "bg-primarypurple text-white"
                            : "border border-gray-300 bg-white text-gray-700"
                            }`}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>

            {actionMutation.isError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
                    <div className="space-y-3" role="status" aria-label="Loading collaboration requests">
                        {collaborationSkeletonIds.map((id) => (
                            <div
                                key={id}
                                className="h-44 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
                            />
                        ))}
                    </div>
                )}

                {requests.isError && (
                    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
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
                            className="font-semibold underline disabled:opacity-60"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!requests.isPending && !requests.isError && visibleRequests.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                        <p className="font-semibold">No {activeTab} requests in the loaded results</p>
                        <p className="mt-1 text-sm text-gray-600">
                            {requests.hasNextPage
                                ? "Load more to check older requests."
                                : "New collaboration activity will appear here."}
                        </p>
                    </div>
                )}

                {visibleRequests.length > 0 && (
                    <>
                        <p className="text-xs text-gray-500" aria-live="polite">
                            Loaded {allRequests.length}
                            {typeof totalCount === "number" ? ` of ${totalCount}` : ""} total requests
                        </p>
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
                                    className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}>
                                                    {request.status}
                                                </span>
                                                <span className="text-xs font-medium capitalize text-gray-500">
                                                    {request.kind}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/platform/projects/${request.project_id}`}
                                                className="mt-2 block text-lg font-semibold text-gray-900 hover:text-primarypurple hover:underline"
                                            >
                                                {request.project_title}
                                            </Link>
                                            <p className="text-sm text-gray-600">
                                                Issue: {request.issue_title}
                                            </p>
                                        </div>
                                        <time
                                            dateTime={request.created_at}
                                            className="shrink-0 text-xs text-gray-500"
                                        >
                                            {formatDate(request.created_at)}
                                        </time>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                                        <p className="font-semibold text-gray-800">
                                            Contributor: {request.user_full_name}
                                        </p>
                                        <p className="text-gray-600">{request.user_nu_email}</p>
                                        {request.message && (
                                            <p className="mt-2 whitespace-pre-wrap text-gray-700">
                                                “{request.message}”
                                            </p>
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
                                                    className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${action === "accept"
                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                        : action === "reject"
                                                            ? "bg-red-600 text-white hover:bg-red-700"
                                                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
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
                    </>
                )}
            </section>

            {requests.hasNextPage && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void requests.fetchNextPage()}
                        disabled={requests.isFetchingNextPage}
                        className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {requests.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
}
