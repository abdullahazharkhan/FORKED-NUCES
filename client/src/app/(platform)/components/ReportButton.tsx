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
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-xs font-bold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
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
                            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                                Your report was submitted. You can track its status from
                                your submitted reports page.
                            </p>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    data-dialog-initial-focus="true"
                                    onClick={closeDialog}
                                    className="inline-flex min-h-11 items-center rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
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
                            <p className="rounded-xl bg-[#f7f6fb] p-4 text-sm leading-6 text-black/65">
                                Report <span className="font-semibold">{targetLabel}</span> for
                                moderator review. Reports are private.
                            </p>

                            <div className="space-y-2">
                                <label htmlFor={`report-reason-${targetType}-${targetId}`} className="text-sm font-bold text-black">
                                    Reason
                                </label>
                                <select
                                    id={`report-reason-${targetType}-${targetId}`}
                                    data-dialog-initial-focus="true"
                                    value={reason}
                                    disabled={reportMutation.isPending}
                                    onChange={(event) => setReason(event.target.value as ReportReason)}
                                    className="min-h-12 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-black outline-none transition focus:border-primarypurple focus:ring-4 focus:ring-primarypurple/10"
                                >
                                    {reasonOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor={`report-details-${targetType}-${targetId}`} className="text-sm font-bold text-black">
                                        Details{" "}
                                        <span className="font-normal text-gray-500">
                                            {reason === "other" ? "(required)" : "(optional)"}
                                        </span>
                                    </label>
                                    <span className="font-mono text-xs text-black/45">{details.length}/2000</span>
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
                                    className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-black/35 focus:border-primarypurple focus:ring-4 focus:ring-primarypurple/10"
                                />
                            </div>

                            {reportMutation.isError && (
                                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {getAuthFormErrorMessage(
                                        reportMutation.error,
                                        "Unable to submit the report."
                                    )}
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={reportMutation.isPending}
                                    onClick={closeDialog}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/15 px-4 text-sm font-bold text-black/65 transition-colors hover:bg-black/[0.04] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        reportMutation.isPending ||
                                        (reason === "other" && !details.trim())
                                    }
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
