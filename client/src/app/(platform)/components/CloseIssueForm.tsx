"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

interface CloseIssueFormProps {
    issueId: number;
    projectId: number;
    onClose: () => void;
}

type AcceptedCollaborationRequest = {
    request_id: number;
    status: string;
    user_id: number;
    user_full_name: string;
    user_nu_email: string;
};

const CloseIssueForm = ({
    issueId,
    projectId,
    onClose,
}: CloseIssueFormProps) => {
    const queryClient = useQueryClient();
    const [selectedRequests, setSelectedRequests] = useState<
        AcceptedCollaborationRequest[]
    >([]);
    const [formError, setFormError] = useState<string | null>(null);

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
    } = useInfiniteQuery<PaginatedPage<AcceptedCollaborationRequest>>({
        queryKey: queryKeys.issueCollaborationRequests(issueId, "accepted"),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
                status: "accepted",
            });
            const response = await authFetch(
                `/api/issues/${issueId}/collaboration-requests?${params.toString()}`,
                { method: "GET", signal }
            );
            if (!response.ok) {
                throw new Error("Failed to load accepted collaborators");
            }
            return readPaginatedArray<AcceptedCollaborationRequest>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const acceptedRequests = useMemo(
        () =>
            data?.pages
                .flatMap((page) => page.items)
                .filter((request) => request.status === "accepted") ?? [],
        [data]
    );
    const initialRequestError = isError && acceptedRequests.length === 0;
    const acceptedRequestIds = useMemo(
        () => new Set(acceptedRequests.map((request) => request.request_id)),
        [acceptedRequests]
    );
    const activeSelectedRequests = selectedRequests.filter((request) =>
        acceptedRequestIds.has(request.request_id)
    );
    const selectedUserIds = activeSelectedRequests.map(
        (request) => request.user_id
    );

    const closeIssueMutation = useMutation({
        mutationFn: async (userIds: number[]) => {
            const response = await authFetch(
                "/api/issues/close-with-collaborator/",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        issue_id: issueId,
                        user_ids: userIds,
                    }),
                }
            );

            const body = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                        "Failed to close issue"
                );
            }
            return body;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.project(projectId),
                }),
                queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.recommendedProjects,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.myProjects,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.allUserProjects,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.allUserCollaborations,
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.projectCollaborators(projectId),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.issueCollaborationRequests(
                        issueId,
                        "accepted"
                    ),
                }),
            ]);
            onClose();
        },
        onError: (mutationError: unknown) => {
            setFormError(
                mutationError instanceof Error
                    ? mutationError.message
                    : "Failed to close issue. Please try again."
            );
        },
    });

    const toggleRequest = (request: AcceptedCollaborationRequest) => {
        if (request.status !== "accepted") return;

        setSelectedRequests((current) =>
            current.some((selected) => selected.request_id === request.request_id)
                ? current.filter(
                      (selected) => selected.request_id !== request.request_id
                  )
                : [...current, request]
        );
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setFormError(null);
        closeIssueMutation.mutate(selectedUserIds);
    };

    const isSubmitting = closeIssueMutation.isPending;

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm text-gray-700">
                Optionally credit contributors whose collaboration requests were
                accepted. The issue will be marked as{" "}
                <span className="font-semibold">Closed</span>.
            </p>

            <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Accepted Collaborators
                </p>
                <p className="text-[11px] text-gray-500">
                    Only contributors who consented through an accepted request
                    can be credited. You may close the issue without selecting
                    anyone.
                </p>
            </div>

            <div
                className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2"
                aria-live="polite"
            >
                {isPending && (
                    <p className="text-xs text-gray-500">
                        Loading accepted collaborators...
                    </p>
                )}

                {initialRequestError && (
                    <div
                        className="flex items-center justify-between gap-3 text-xs text-red-600"
                        role="alert"
                    >
                        <span>
                            {(error as Error)?.message ||
                                "Failed to load accepted collaborators."}
                        </span>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            disabled={isFetching}
                            className="font-semibold underline disabled:opacity-60"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isPending &&
                    !initialRequestError &&
                    acceptedRequests.length === 0 && (
                        <p className="text-xs text-gray-500">
                            No accepted collaboration requests yet. You can still
                            close this issue without crediting a collaborator.
                        </p>
                    )}

                {!initialRequestError &&
                    acceptedRequests.map((request) => {
                        const isSelected = activeSelectedRequests.some(
                            (selected) =>
                                selected.request_id === request.request_id
                        );
                        return (
                            <button
                                key={request.request_id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => toggleRequest(request)}
                                className={`flex w-full flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition ${
                                    isSelected
                                        ? "border-primarypurple bg-primarypurple/10 text-primarypurple"
                                        : "border-transparent bg-white hover:bg-gray-100"
                                }`}
                            >
                                <span className="font-semibold">
                                    {request.user_full_name}
                                </span>
                                <span className="text-[11px] text-gray-600">
                                    {request.user_nu_email}
                                </span>
                            </button>
                        );
                    })}

                {isFetchNextPageError && (
                    <div
                        className="flex items-center justify-between gap-3 text-xs text-red-600"
                        role="alert"
                    >
                        <span>Could not load more accepted collaborators.</span>
                        <button
                            type="button"
                            onClick={() => void fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="font-semibold underline disabled:opacity-60"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {hasNextPage && !isFetchNextPageError && (
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-100 disabled:opacity-60"
                    >
                        {isFetchingNextPage
                            ? "Loading more..."
                            : "Load more accepted collaborators"}
                    </button>
                )}
            </div>

            {activeSelectedRequests.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Credited Collaborators ({activeSelectedRequests.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {activeSelectedRequests.map((request) => (
                            <span
                                key={request.request_id}
                                className="inline-flex items-center gap-1 rounded-full bg-primarypurple/10 px-2 py-1 text-xs text-primarypurple"
                            >
                                {request.user_full_name}
                                <button
                                    type="button"
                                    aria-label={`Remove ${request.user_full_name} from credited collaborators`}
                                    onClick={() => toggleRequest(request)}
                                    className="ml-1 text-primarypurple/60 hover:text-primarypurple"
                                >
                                    x
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {formError && (
                <p className="text-xs text-red-600" role="alert">
                    {formError}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-primarypurple px-4 py-2 text-sm font-semibold text-white transition hover:bg-primarypurple/90 disabled:opacity-60"
                >
                    {isSubmitting ? "Closing..." : "Close Issue"}
                </button>
            </div>
        </form>
    );
};

export default CloseIssueForm;
