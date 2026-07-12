"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { Check, UserRound, X } from "lucide-react";

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
        <form className="space-y-6" onSubmit={handleSubmit}>
            <p className="rounded-xl bg-[#f7f6fb] p-4 text-sm leading-6 text-black/65">
                Optionally credit contributors whose collaboration requests were
                accepted. The issue will be marked as{" "}
                <span className="font-semibold">Closed</span>.
            </p>

            <div className="space-y-1.5">
                <p className="text-sm font-black text-black">
                    Accepted Collaborators
                </p>
                <p className="text-xs leading-5 text-black/50">
                    Only contributors who consented through an accepted request
                    can be credited. You may close the issue without selecting
                    anyone.
                </p>
            </div>

            <div
                className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-black/[0.08] bg-[#f8f7fc] p-3"
                aria-live="polite"
            >
                {isPending && (
                    <p className="rounded-xl bg-white p-4 text-xs text-black/50">
                        Loading accepted collaborators...
                    </p>
                )}

                {initialRequestError && (
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
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
                            className="font-bold underline underline-offset-2 disabled:opacity-60"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isPending &&
                    !initialRequestError &&
                    acceptedRequests.length === 0 && (
                        <p className="rounded-xl bg-white p-4 text-xs leading-5 text-black/50">
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
                                className={`group flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs transition ${
                                    isSelected
                                        ? "border-primarypurple bg-primarypurple text-white"
                                        : "border-black/[0.06] bg-white text-black hover:border-primarypurple/25"
                                }`}
                            >
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-white/15" : "bg-primarypurple/10 text-primarypurple"}`}>
                                    {isSelected ? (
                                        <Check className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <UserRound className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-bold">
                                        {request.user_full_name}
                                    </span>
                                    <span className={`mt-0.5 block truncate text-[11px] ${isSelected ? "text-white/65" : "text-black/45"}`}>
                                        {request.user_nu_email}
                                    </span>
                                </span>
                            </button>
                        );
                    })}

                {isFetchNextPageError && (
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                        role="alert"
                    >
                        <span>Could not load more accepted collaborators.</span>
                        <button
                            type="button"
                            onClick={() => void fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="font-bold underline underline-offset-2 disabled:opacity-60"
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
                        className="min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-black/65 transition-colors hover:border-primarypurple/30 hover:text-primarypurple disabled:opacity-60"
                    >
                        {isFetchingNextPage
                            ? "Loading more..."
                            : "Load more accepted collaborators"}
                    </button>
                )}
            </div>

            {activeSelectedRequests.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                        Credited Collaborators ({activeSelectedRequests.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {activeSelectedRequests.map((request) => (
                            <span
                                key={request.request_id}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primarypurple/10 px-3 text-xs font-bold text-primarypurple"
                            >
                                {request.user_full_name}
                                <button
                                    type="button"
                                    aria-label={`Remove ${request.user_full_name} from credited collaborators`}
                                    onClick={() => toggleRequest(request)}
                                    className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-primarypurple/60 transition-colors hover:bg-primarypurple hover:text-white"
                                >
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                    {formError}
                </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-black/[0.07] pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04] disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
                >
                    {isSubmitting ? "Closing..." : "Close Issue"}
                </button>
            </div>
        </form>
    );
};

export default CloseIssueForm;
