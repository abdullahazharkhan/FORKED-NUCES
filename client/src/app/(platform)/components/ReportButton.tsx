"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import { reportQueryKeys } from "@/lib/engagementQueryKeys";
import { AccessibleDialog } from "./AccessibleDialog";

type ReportTargetType = "project" | "user" | "issue" | "comment";
type ReportReason =
    | "spam"
    | "harassment"
    | "inappropriate"
    | "impersonation"
    | "privacy"
    | "other";

type ReportButtonProps = {
    targetId: number;
    targetLabel: string;
    targetType: ReportTargetType;
};

type ReportResponse = { report_id: number };

const reasonOptions = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "impersonation", label: "Impersonation" },
    { value: "privacy", label: "Privacy concern" },
    { value: "other", label: "Other" },
] as const satisfies ReadonlyArray<{ value: ReportReason; label: string }>;

export function ReportButton({
    targetId,
    targetLabel,
    targetType,
}: ReportButtonProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<ReportReason>("spam");
    const [details, setDetails] = useState("");

    const reportMutation = useMutation({
        mutationFn: async () => {
            const response = await authFetch("/api/moderation/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_type: targetType,
                    target_id: targetId,
                    reason,
                    details: details.trim(),
                }),
            });
            return readAuthResponse<ReportResponse>(
                response,
                "Unable to submit the report."
            );
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });
        },
    });

    const closeDialog = () => {
        if (reportMutation.isPending) return;
        setIsOpen(false);
        setReason("spam");
        setDetails("");
        reportMutation.reset();
    };

    const openDialog = () => {
        reportMutation.reset();
        setIsOpen(true);
    };

    return (
        <>
            <button
                type="button"
                aria-haspopup="dialog"
                onClick={openDialog}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                Report
            </button>

            {isOpen && (
                <AccessibleDialog
                    title={`Report ${targetType}`}
                    closeDisabled={reportMutation.isPending}
                    onClose={closeDialog}
                >
                    {reportMutation.isSuccess ? (
                        <div className="space-y-4">
                            <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                Your report was submitted. You can track its status from
                                your submitted reports page.
                            </p>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    data-dialog-initial-focus="true"
                                    onClick={closeDialog}
                                    className="rounded-lg bg-primarypurple px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (reason === "other" && !details.trim()) return;
                                reportMutation.mutate();
                            }}
                        >
                            <p className="text-sm text-gray-700">
                                Report <span className="font-semibold">{targetLabel}</span> for
                                moderator review. Reports are private.
                            </p>

                            <div className="space-y-1">
                                <label htmlFor={`report-reason-${targetType}-${targetId}`} className="text-sm font-semibold">
                                    Reason
                                </label>
                                <select
                                    id={`report-reason-${targetType}-${targetId}`}
                                    data-dialog-initial-focus="true"
                                    value={reason}
                                    disabled={reportMutation.isPending}
                                    onChange={(event) => setReason(event.target.value as ReportReason)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primarypurple"
                                >
                                    {reasonOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor={`report-details-${targetType}-${targetId}`} className="text-sm font-semibold">
                                        Details{" "}
                                        <span className="font-normal text-gray-500">
                                            {reason === "other" ? "(required)" : "(optional)"}
                                        </span>
                                    </label>
                                    <span className="text-xs text-gray-500">{details.length}/2000</span>
                                </div>
                                <textarea
                                    id={`report-details-${targetType}-${targetId}`}
                                    rows={5}
                                    maxLength={2000}
                                    required={reason === "other"}
                                    disabled={reportMutation.isPending}
                                    value={details}
                                    onChange={(event) => setDetails(event.target.value)}
                                    placeholder="Describe the concern without including sensitive personal information."
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primarypurple"
                                />
                            </div>

                            {reportMutation.isError && (
                                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {getAuthFormErrorMessage(
                                        reportMutation.error,
                                        "Unable to submit the report."
                                    )}
                                </p>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={reportMutation.isPending}
                                    onClick={closeDialog}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        reportMutation.isPending ||
                                        (reason === "other" && !details.trim())
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    )}
                </AccessibleDialog>
            )}
        </>
    );
}
