"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/authFetch";
import { Search } from "lucide-react";

interface CloseIssueFormProps {
    issueId: number;
    projectId: number;
    onClose: () => void;
}

type UserResult = {
    user_id: number;
    full_name: string;
    nu_email: string;
};

const CloseIssueForm: React.FC<CloseIssueFormProps> = ({
    issueId,
    projectId,
    onClose,
}) => {
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = React.useState("");
    const [debouncedTerm, setDebouncedTerm] = React.useState("");
    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
        null
    );
    const [formError, setFormError] = React.useState<string | null>(null);

    // Debounce search input (for client-side filtering only)
    React.useEffect(() => {
        const id = setTimeout(
            () => setDebouncedTerm(searchTerm.trim()),
            300
        );
        return () => clearTimeout(id);
    }, [searchTerm]);

    // Fetch ALL users once and cache with React Query
    const {
        data: usersData,
        isLoading,
        isError,
        error,
    } = useQuery<UserResult[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await authFetch(`/api/users`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch users");
            }

            return res.json();
        },
        // Optional: keep in cache for some time
        staleTime: 5 * 60 * 1000,
    });

    const allUsers: UserResult[] = Array.isArray(usersData) ? usersData : [];

    // Client-side filtering based on debounced search term
    const filteredUsers = React.useMemo(() => {
        const term = debouncedTerm.toLowerCase();
        if (term.length < 2) return [];
        return allUsers.filter(
            (user) =>
                user.full_name.toLowerCase().includes(term) ||
                user.nu_email.toLowerCase().includes(term)
        );
    }, [allUsers, debouncedTerm]);

    const closeIssueMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserId) {
                throw new Error("Please select a collaborator.");
            }

            const res = await authFetch(
                `/api/issues/close-with-collaborator/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        issue_id: issueId,
                        user_id: selectedUserId,
                    }),
                }
            );

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    (body && (body.detail || body.message)) ||
                    "Failed to close issue"
                );
            }

            return body;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["project", projectId],
            });

            queryClient.invalidateQueries({ queryKey: ["projects"] });

            queryClient.invalidateQueries({
                queryKey: ["project-collaborators", projectId],
            });

            onClose();
        },
        onError: (err: any) => {
            setFormError(
                err?.message || "Failed to close issue. Please try again."
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!selectedUserId) {
            setFormError("Please select a collaborator before closing.");
            return;
        }

        closeIssueMutation.mutate();
    };

    const isSubmitting = closeIssueMutation.isPending;

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm text-gray-700">
                Select a collaborator who helped resolve this issue. The issue
                will be marked as <span className="font-semibold">Closed</span>.
            </p>

            {/* Search input */}
            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Search User (name or NU email)
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Start typing to search…"
                        className="w-full border-none text-sm outline-none"
                    />
                </div>
                <p className="text-[11px] text-gray-500">
                    Minimum 2 characters required to filter.
                </p>
            </div>

            {/* Results */}
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                {isLoading && (
                    <p className="text-xs text-gray-500">
                        Loading users…
                    </p>
                )}

                {!isLoading && isError && (
                    <p className="text-xs text-red-600">
                        {(error as Error)?.message ||
                            "Failed to load users."}
                    </p>
                )}

                {!isLoading && !isError && debouncedTerm.length < 2 && (
                    <p className="text-xs text-gray-500">
                        Type at least 2 characters to search for users.
                    </p>
                )}

                {!isLoading &&
                    !isError &&
                    debouncedTerm.length >= 2 &&
                    filteredUsers.length === 0 && (
                        <p className="text-xs text-gray-500">
                            No users found for this query.
                        </p>
                    )}

                {!isLoading &&
                    !isError &&
                    debouncedTerm.length >= 2 &&
                    filteredUsers.map((user) => {
                        const isSelected = selectedUserId === user.user_id;
                        return (
                            <button
                                key={user.user_id}
                                type="button"
                                onClick={() => setSelectedUserId(user.user_id)}
                                className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-xs transition ${isSelected
                                    ? "bg-primarypurple/10 border border-primarypurple text-primarypurple"
                                    : "bg-white border border-transparent hover:bg-gray-100"
                                    }`}
                            >
                                <span className="font-semibold">
                                    {user.full_name}
                                </span>
                                <span className="text-[11px] text-gray-600">
                                    {user.nu_email}
                                </span>
                            </button>
                        );
                    })}
            </div>

            {/* Error */}
            {formError && (
                <p className="text-xs text-red-600">{formError}</p>
            )}

            {/* Actions */}
            <div className="mt-2 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedUserId}
                    className="rounded-lg bg-primarypurple px-4 py-2 text-sm font-semibold text-white hover:bg-primarypurple/90 disabled:opacity-60 transition"
                >
                    {isSubmitting ? "Closing..." : "Close Issue"}
                </button>
            </div>
        </form>
    );
};

export default CloseIssueForm;
