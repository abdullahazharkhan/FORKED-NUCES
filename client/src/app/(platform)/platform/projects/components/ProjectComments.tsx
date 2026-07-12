"use client";

import React from "react";
import {
    type InfiniteData,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { useAuthStore } from "@/stores";
import { Trash2 } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { readPaginatedArray, type PaginatedPage } from "@/lib/pagination";
import { ReportButton } from "@/app/(platform)/components/ReportButton";

const PAGE_SIZE = 20;
const COMMENT_SKELETON_IDS = ["one", "two", "three"] as const;

type Comment = {
    comment_id: number;
    comment_body: string;
    created_at?: string;
    user_id?: number;
    user_full_name?: string;
    user_nu_email?: string;
};

type ProjectCommentsProps = {
    projectid: string | number;
    projectOwnerId?: number;
};

const MAX_COMMENT_LENGTH = 2_000;

type CommentPages = InfiniteData<PaginatedPage<Comment>, unknown>;

function prependComment(
    current: CommentPages | undefined,
    comment: Comment
): CommentPages {
    if (!current) {
        return {
            pageParams: [0],
            pages: [
                {
                    items: [comment],
                    limit: PAGE_SIZE,
                    nextOffset: null,
                    offset: 0,
                    totalCount: 1,
                },
            ],
        };
    }

    return {
        ...current,
        pages: current.pages.map((page, index) => ({
            ...page,
            items: index === 0 ? [comment, ...page.items] : page.items,
            totalCount:
                page.totalCount === null ? null : page.totalCount + 1,
        })),
    };
}

function removeComment(
    current: CommentPages | undefined,
    commentId: number
): CommentPages | undefined {
    if (!current) return current;

    return {
        ...current,
        pages: current.pages.map((page) => {
            const items = page.items.filter(
                (comment) => comment.comment_id !== commentId
            );
            const removed = items.length !== page.items.length;
            return {
                ...page,
                items,
                totalCount:
                    removed && page.totalCount !== null
                        ? Math.max(0, page.totalCount - 1)
                        : page.totalCount,
            };
        }),
    };
}

const CommentsSkeleton = () => {
    return (
        <div className="space-y-3 mt-3">
            {COMMENT_SKELETON_IDS.map((id) => (
                <div
                    key={id}
                    className="rounded-lg border border-primarypurple/10 bg-white/80 p-3 space-y-2 animate-pulse"
                >
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                </div>
            ))}
        </div>
    );
};

const ProjectComments = ({ projectid, projectOwnerId }: ProjectCommentsProps) => {
    const queryClient = useQueryClient();
    const projectIdNumber = Number(projectid);
    const loggedInUser = useAuthStore((state) => state.user);

    const [newComment, setNewComment] = React.useState("");
    const [formError, setFormError] = React.useState<string | null>(null);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const invalidateProjectSurfaces = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recommendedProjects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allUserProjects }),
    ]);

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
    } = useInfiniteQuery<PaginatedPage<Comment>>({
        queryKey: queryKeys.projectComments(projectid),
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(PAGE_SIZE),
                offset: String(pageParam),
            });
            const response = await authFetch(
                `/api/projects/${projectid}/comments?${params.toString()}`,
                { method: "GET", signal }
            );

            if (!response.ok) throw new Error("Failed to fetch comments");
            return readPaginatedArray<Comment>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const comments = React.useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data]
    );
    const initialError = isError && comments.length === 0;

    // Create comment mutation
    const createCommentMutation = useMutation({
        mutationFn: async (payload: { comment_body: string }) => {
            const res = await authFetch(`/api/comments/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectIdNumber,
                    comment_body: payload.comment_body,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to add comment"
                );
            }

            return body;
        },
        onMutate: async (payload) => {
            setFormError(null);

            await queryClient.cancelQueries({
                queryKey: queryKeys.projectComments(projectid),
            });

            const previousComments = queryClient.getQueryData<CommentPages>(
                queryKeys.projectComments(projectid)
            );

            const optimistic: Comment = {
                comment_id: -Date.now(),
                comment_body: payload.comment_body,
                created_at: new Date().toISOString(),
                user_id: loggedInUser?.user_id,
                user_full_name: loggedInUser?.full_name,
                user_nu_email: loggedInUser?.nu_email,
            };

            queryClient.setQueryData<CommentPages>(
                queryKeys.projectComments(projectid),
                (current) => prependComment(current, optimistic)
            );

            return {
                optimisticId: optimistic.comment_id,
                previousComments,
            };
        },
        onError: (err, _vars, context) => {
            if (context?.previousComments !== undefined) {
                queryClient.setQueryData(
                    queryKeys.projectComments(projectid),
                    context.previousComments
                );
            } else if (context?.optimisticId !== undefined) {
                queryClient.setQueryData<CommentPages>(
                    queryKeys.projectComments(projectid),
                    (current) => removeComment(current, context.optimisticId)
                );
            }
            setFormError(
                (err as Error)?.message || "Failed to add comment."
            );
        },
        onSuccess: async () => {
            setNewComment("");
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.projectComments(projectid),
                }),
                invalidateProjectSurfaces(),
            ]);
        },
    });

    // Delete comment mutation
    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: number) => {
            const res = await authFetch(`/api/comments/${commentId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to delete comment"
                );
            }

            return body;
        },
        onMutate: async (commentId) => {
            setDeleteError(null);
            await queryClient.cancelQueries({
                queryKey: queryKeys.projectComments(projectid),
            });

            const previousComments = queryClient.getQueryData<CommentPages>(
                queryKeys.projectComments(projectid)
            );

            queryClient.setQueryData<CommentPages>(
                queryKeys.projectComments(projectid),
                (current) => removeComment(current, commentId)
            );

            return { previousComments };
        },
        onError: (mutationError, _vars, context) => {
            if (context?.previousComments !== undefined) {
                queryClient.setQueryData(
                    queryKeys.projectComments(projectid),
                    context.previousComments
                );
            }
            setDeleteError(
                mutationError instanceof Error && mutationError.message
                    ? mutationError.message
                    : "Failed to delete comment. Please try again."
            );
        },
        onSuccess: async () => {
            setDeleteError(null);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.projectComments(projectid),
                }),
                invalidateProjectSurfaces(),
            ]);
        },
    });

    const canDeleteComment = (comment: Comment) => {
        if (!loggedInUser) return false;
        if (comment.comment_id <= 0) return false;
        const isCommentAuthor = comment.user_id === loggedInUser.user_id;
        const isProjectOwner = projectOwnerId === loggedInUser.user_id;
        return isCommentAuthor || isProjectOwner;
    };

    const canReportComment = (comment: Comment) =>
        Boolean(
            loggedInUser &&
            comment.comment_id > 0 &&
            comment.user_id !== loggedInUser.user_id
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = newComment.trim();

        if (!value) {
            setFormError("Comment cannot be empty.");
            return;
        }

        if (value.length > MAX_COMMENT_LENGTH) {
            setFormError(
                `Comment must be ${MAX_COMMENT_LENGTH.toLocaleString()} characters or fewer.`
            );
            return;
        }

        createCommentMutation.mutate({ comment_body: value });
    };

    return (
        <div className="space-y-3 border-t border-primarypurple/20 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Comments</h2>
                    <p className="text-xs text-gray-600">
                        See what others are saying about this project.
                    </p>
                </div>
            </div>

            {/* Add Comment Form */}
            <form
                onSubmit={handleSubmit}
                className="space-y-2 rounded-xl border border-primarypurple/25 bg-white/90 p-3 shadow-sm"
            >
                <label
                    htmlFor="project-comment-body"
                    className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                    Add a comment
                </label>
                <textarea
                    id="project-comment-body"
                    value={newComment}
                    maxLength={MAX_COMMENT_LENGTH}
                    onChange={(e) => {
                        setNewComment(e.target.value);
                        if (formError) setFormError(null);
                    }}
                    rows={3}
                    placeholder="Share your thoughts about this project..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primarypurple focus:ring-1 focus:ring-primarypurple/50"
                />
                {formError && (
                    <p className="text-[11px] text-red-600" role="alert">
                        {formError}
                    </p>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={createCommentMutation.isPending}
                        className="rounded-lg bg-primarypurple px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primarypurple/90 disabled:opacity-60"
                    >
                        {createCommentMutation.isPending
                            ? "Posting..."
                            : "Post Comment"}
                    </button>
                </div>
            </form>

            {/* Loading */}
            {isPending && <CommentsSkeleton />}

            {/* Error */}
            {initialError && (
                <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    <span>
                        {(error as Error)?.message ||
                            "Failed to load comments."}
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

            {deleteError && (
                <p
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    {deleteError}
                </p>
            )}

            {/* Empty state */}
            {!isPending && !initialError && comments.length === 0 && (
                <p className="text-sm text-gray-600">
                    No comments yet. Be the first to comment on this project.
                </p>
            )}

            {/* Comments list */}
            {!isPending && !initialError && comments.length > 0 && (
                <div className="space-y-2">
                    {comments.map((comment) => (
                        <div
                            key={comment.comment_id}
                            className="rounded-lg border border-primarypurple/10 bg-white/80 p-3"
                        >
                            {/* Meta (optional user info) */}
                            <div className="mb-1 flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                    {comment.user_full_name && (
                                        <span className="font-semibold text-gray-700">
                                            {comment.user_full_name}
                                        </span>
                                    )}
                                    {comment.user_nu_email && (
                                        <span>{comment.user_nu_email}</span>
                                    )}
                                    {comment.created_at && (
                                        <span>
                                            ·{" "}
                                            {new Date(
                                                comment.created_at
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {canReportComment(comment) && (
                                        <ReportButton
                                            targetId={comment.comment_id}
                                            targetLabel={`comment by ${comment.user_full_name || "this user"}`}
                                            targetType="comment"
                                        />
                                    )}

                                    {canDeleteComment(comment) && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteCommentMutation.mutate(
                                                    comment.comment_id
                                                )
                                            }
                                            disabled={deleteCommentMutation.isPending}
                                            className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                            title="Delete comment"
                                            aria-label={`Delete comment by ${
                                                comment.user_full_name || "this user"
                                            }`}
                                        >
                                            <Trash2
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {comment.comment_body}
                            </p>
                        </div>
                    ))}

                    {isFetchNextPageError && (
                        <div
                            className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            role="alert"
                        >
                            <span>Could not load more comments.</span>
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
                            className="w-full rounded-lg border border-primarypurple/25 bg-white px-4 py-2 text-sm font-semibold text-primarypurple transition hover:bg-primarypurple/5 disabled:opacity-60"
                        >
                            {isFetchingNextPage
                                ? "Loading more comments..."
                                : "Load more comments"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectComments;
