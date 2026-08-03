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
import {
    LoaderCircle,
    MessageCircle,
    MessagesSquare,
    RefreshCw,
    Send,
    Trash2,
    UserRound,
} from "lucide-react";
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
        <div
            className="mt-4 space-y-3"
            role="status"
            aria-label="Loading project comments"
        >
            {COMMENT_SKELETON_IDS.map((id) => (
                <div
                    key={id}
                    className="animate-pulse space-y-3 rounded-2xl bg-[#f7f6fb] p-4 ring-1 ring-black/[0.04]"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primarypurple/10" />
                        <div className="h-3 w-32 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-3 w-3/4 rounded-full bg-gray-100" />
                    <div className="h-3 w-2/3 rounded-full bg-gray-100" />
                </div>
            ))}
            <span className="sr-only">Loading comments...</span>
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

    const invalidateProjectSurfaces = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.project(projectid),
            }),
            queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.recommendedProjects,
            }),
            queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.allUserProjects,
            }),
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
        <section
            className="relative isolate overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white p-5 shadow-[0_18px_55px_rgba(42,25,86,0.07)] sm:p-7"
            aria-labelledby="project-comments-heading"
        >
            <div
                className="pointer-events-none absolute left-6 top-0 h-1 w-16 rounded-b-full bg-primarygreen"
                aria-hidden="true"
            />
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primarypurple text-white shadow-[0_8px_20px_rgba(76,41,178,0.18)]">
                        <MessagesSquare className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="mb-1 font-mono text-[0.65rem] font-bold tracking-[0.18em] text-primarypurple">
                            Join the conversation
                        </p>
                        <h2
                            id="project-comments-heading"
                            className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl"
                        >
                            Comments
                        </h2>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-600">
                            Share useful feedback, ask a question, or encourage
                            the people building this project.
                        </p>
                    </div>
                </div>

                {!isPending && !initialError && (
                    <span className="w-fit rounded-xl bg-primarypurple/[0.07] px-3 py-2 font-mono text-xs font-bold text-primarypurple ring-1 ring-primarypurple/10">
                        {comments.length.toLocaleString()} loaded
                    </span>
                )}
            </div>

            {/* Add Comment Form */}
            <form
                onSubmit={handleSubmit}
                aria-busy={createCommentMutation.isPending}
                className="rounded-2xl bg-[#f8f7fc] p-4 ring-1 ring-primarypurple/[0.08] sm:p-5"
            >
                <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primarygreen/80 text-black">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <label
                        htmlFor="project-comment-body"
                        className="text-sm font-bold text-gray-950"
                    >
                        Add a comment
                    </label>
                </div>
                <textarea
                    id="project-comment-body"
                    value={newComment}
                    maxLength={MAX_COMMENT_LENGTH}
                    aria-describedby={`project-comment-help project-comment-count${formError ? " project-comment-error" : ""}`}
                    aria-invalid={Boolean(formError)}
                    disabled={createCommentMutation.isPending}
                    onChange={(e) => {
                        setNewComment(e.target.value);
                        if (formError) setFormError(null);
                    }}
                    rows={4}
                    placeholder="Share your thoughts about this project..."
                    className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-[#fcfbff] px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-primarypurple/30 focus:border-primarypurple focus:bg-white focus:ring-4 focus:ring-primarypurple/10"
                />
                {formError && (
                    <p
                        id="project-comment-error"
                        className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                        role="alert"
                    >
                        {formError}
                    </p>
                )}

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-gray-500 sm:justify-start">
                        <span id="project-comment-help">
                            Keep it constructive and relevant.
                        </span>
                        <span
                            id="project-comment-count"
                            className={
                                newComment.length >= MAX_COMMENT_LENGTH
                                    ? "font-bold text-red-600"
                                    : "font-medium text-gray-500"
                            }
                        >
                            {newComment.length.toLocaleString()} /{" "}
                            {MAX_COMMENT_LENGTH.toLocaleString()}
                        </span>
                    </div>
                    <button
                        type="submit"
                        disabled={createCommentMutation.isPending}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(76,41,178,0.18)] transition-colors hover:bg-[#382080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        {createCommentMutation.isPending ? (
                            <LoaderCircle
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                        ) : (
                            <Send className="h-4 w-4" aria-hidden="true" />
                        )}
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
                    className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-bold no-underline transition hover:border-red-300 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            )}

            {deleteError && (
                <p
                    className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                >
                    {deleteError}
                </p>
            )}

            {/* Empty state */}
            {!isPending && !initialError && comments.length === 0 && (
                <div className="mt-4 rounded-2xl border border-dashed border-primarypurple/25 bg-[#faf9fc] px-5 py-10 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                        <MessageCircle className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="font-bold text-gray-900">Start the conversation</p>
                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-600">
                        No comments yet. Be the first to share a thoughtful note
                        about this project.
                    </p>
                </div>
            )}

            {/* Comments list */}
            {!isPending && !initialError && comments.length > 0 && (
                <div className="mt-4 space-y-3">
                    {comments.map((comment) => (
                        <article
                            key={comment.comment_id}
                            className="rounded-2xl border border-black/[0.05] bg-[#faf9fc] p-4 transition duration-200 hover:border-primarypurple/15 hover:bg-white hover:shadow-[0_10px_28px_rgba(55,34,110,0.06)] sm:p-5"
                        >
                            {/* Meta (optional user info) */}
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primarypurple/10 text-primarypurple">
                                        <UserRound
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-gray-950">
                                            {comment.user_full_name ||
                                                "Community member"}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.7rem] text-gray-500">
                                            {comment.user_nu_email && (
                                                <span className="max-w-full truncate">
                                                    {comment.user_nu_email}
                                                </span>
                                            )}
                                            {comment.created_at && (
                                                <time dateTime={comment.created_at}>
                                                    {new Date(
                                                        comment.created_at
                                                    ).toLocaleDateString()}
                                                </time>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
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
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-400 ring-1 ring-black/[0.05] transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
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

                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                {comment.comment_body}
                            </p>
                        </article>
                    ))}

                    {isFetchNextPageError && (
                        <div
                            className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
                            role="alert"
                        >
                            <span>Could not load more comments.</span>
                            <button
                                type="button"
                                onClick={() => void fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="min-h-11 rounded-xl px-3 font-bold underline underline-offset-2 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-60"
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
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primarypurple/20 bg-white px-4 py-2.5 text-sm font-bold text-primarypurple transition hover:border-primarypurple/40 hover:bg-primarypurple/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isFetchingNextPage && (
                                <LoaderCircle
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {isFetchingNextPage
                                ? "Loading more comments..."
                                : "Load more comments"}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

export default ProjectComments;
