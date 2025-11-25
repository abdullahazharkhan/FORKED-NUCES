"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";

type Comment = {
    comment_id: number;
    comment_body: string;
    created_at?: string;
    user_full_name?: string;
    user_nu_email?: string;
};

const CommentsSkeleton: React.FC = () => {
    return (
        <div className="space-y-3 mt-3">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={idx}
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

const ProjectComments = ({ projectid }: { projectid: string }) => {
    const queryClient = useQueryClient();
    const projectIdNumber = Number(projectid);

    const [newComment, setNewComment] = React.useState("");
    const [formError, setFormError] = React.useState<string | null>(null);

    // Fetch comments
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["project-comments", projectid],
        queryFn: async () => {
            const res = await authFetch(
                `/api/projects/${projectid}/comments`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch comments");
            }

            const body = await res.json();
            return Array.isArray(body) ? body : [];
        },
    });

    const comments: Comment[] = data || [];

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
                queryKey: ["project-comments", projectid],
            });

            const previousComments =
                queryClient.getQueryData<Comment[]>([
                    "project-comments",
                    projectid,
                ]) || [];

            const optimistic: Comment = {
                comment_id: Date.now(),
                comment_body: payload.comment_body,
                created_at: new Date().toISOString(),
            };

            queryClient.setQueryData<Comment[]>(
                ["project-comments", projectid],
                [optimistic, ...previousComments]
            );

            return { previousComments };
        },
        onError: (err, _vars, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(
                    ["project-comments", projectid],
                    context.previousComments
                );
            }
            setFormError(
                (err as Error)?.message || "Failed to add comment."
            );
        },
        onSuccess: () => {
            setNewComment("");
            queryClient.invalidateQueries({
                queryKey: ["project-comments", projectid],
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = newComment.trim();

        if (!value) {
            setFormError("Comment cannot be empty.");
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
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Add a comment
                </label>
                <textarea
                    value={newComment}
                    onChange={(e) => {
                        setNewComment(e.target.value);
                        if (formError) setFormError(null);
                    }}
                    rows={3}
                    placeholder="Share your thoughts about this project..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primarypurple focus:ring-1 focus:ring-primarypurple/50"
                />
                {formError && (
                    <p className="text-[11px] text-red-600">{formError}</p>
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
            {isLoading && <CommentsSkeleton />}

            {/* Error */}
            {isError && !isLoading && (
                <p className="text-sm text-red-600">
                    {(error as Error)?.message ||
                        "Failed to load comments."}
                </p>
            )}

            {/* Empty state */}
            {!isLoading && !isError && comments.length === 0 && (
                <p className="text-sm text-gray-600">
                    No comments yet. Be the first to comment on this project.
                </p>
            )}

            {/* Comments list */}
            {!isLoading && !isError && comments.length > 0 && (
                <div className="space-y-2">
                    {comments.map((comment) => (
                        <div
                            key={comment.comment_id}
                            className="rounded-lg border border-primarypurple/10 bg-white/80 p-3"
                        >
                            {/* Meta (optional user info) */}
                            {(comment.user_full_name ||
                                comment.user_nu_email ||
                                comment.created_at) && (
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
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
                                )}

                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {comment.comment_body}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectComments;
