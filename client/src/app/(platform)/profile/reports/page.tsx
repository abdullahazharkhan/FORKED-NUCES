"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import { reportQueryKeys } from "@/lib/engagementQueryKeys";
import { readPaginatedArray } from "@/lib/pagination";

type ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";
type ReportItem = {
    report_id: number;
    target_type: "user" | "project" | "issue" | "comment";
    target_id: number;
    target_snapshot: Record<string, unknown>;
    reason: string;
    details: string;
    status: ReportStatus;
    resolution_notes: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
};

const pageSize = 20;
const reportSkeletonIds = ["one", "two", "three", "four"] as const;
const statusStyles: Record<ReportStatus, string> = {
    open: "bg-amber-100 text-amber-800",
    reviewing: "bg-blue-100 text-blue-800",
    actioned: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-700",
};
const reasonLabels: Record<string, string> = {
    spam: "Spam",
    harassment: "Harassment",
    inappropriate: "Inappropriate content",
    impersonation: "Impersonation",
    privacy: "Privacy concern",
    other: "Other",
};

function reportLabel(report: ReportItem): string {
    for (const key of ["title", "full_name", "label"]) {
        const value = report.target_snapshot[key];
        if (typeof value === "string" && value.trim()) return value;
    }
    return `${report.target_type} #${report.target_id}`;
}

function entityPath(
    segment: "projects" | "users",
    value: unknown
): string | null {
    return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
        ? `/platform/${segment}/${value}`
        : null;
}

function reportLink(report: ReportItem): string | null {
    if (report.target_type === "project") {
        return entityPath("projects", report.target_id);
    }
    if (report.target_type === "user") {
        return entityPath("users", report.target_id);
    }
    const projectId = report.target_snapshot.project_id;
    return entityPath("projects", projectId);
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return `${date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    })} UTC`;
}

export default function SubmittedReportsPage() {
    const reports = useInfiniteQuery({
        queryKey: reportQueryKeys.submitted,
        initialPageParam: 0,
        queryFn: async ({ pageParam, signal }) => {
            const params = new URLSearchParams({
                limit: String(pageSize),
                offset: String(pageParam),
            });
            const response = await authFetch(`/api/moderation/reports?${params}`, {
                signal,
            });
            if (!response.ok) {
                await readAuthResponse(response, "Unable to load submitted reports.");
            }
            return readPaginatedArray<ReportItem>(response);
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    });

    const items = reports.data?.pages.flatMap((page) => page.items) ?? [];
    const totalCount = reports.data?.pages[0]?.totalCount;

    return (
        <div className="mx-auto mt-6 max-w-4xl space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
                        <ClipboardList className="h-8 w-8 text-primarypurple" aria-hidden="true" />
                        Submitted Reports
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Track the moderation status of concerns you submitted.
                    </p>
                </div>
                <Link href="/profile" className="text-sm font-semibold text-primarypurple underline">
                    Back to profile
                </Link>
            </header>

            {reports.isPending && (
                <div className="space-y-3" role="status" aria-label="Loading submitted reports">
                    {reportSkeletonIds.map((id) => (
                        <div key={id} className="h-40 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            )}

            {reports.isError && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    <span>
                        {getAuthFormErrorMessage(
                            reports.error,
                            "Unable to load submitted reports."
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => void reports.refetch()}
                        disabled={reports.isFetching}
                        className="font-semibold underline disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!reports.isPending && !reports.isError && items.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="font-semibold">You have not submitted any reports.</p>
                    <p className="mt-1 text-sm text-gray-600">
                        Reports created from project or user pages will appear here.
                    </p>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-4">
                    <p className="text-xs text-gray-500" aria-live="polite">
                        Showing {items.length}
                        {typeof totalCount === "number" ? ` of ${totalCount}` : ""}
                    </p>
                    {items.map((report) => {
                        const href = reportLink(report);
                        const label = reportLabel(report);
                        return (
                            <article key={report.report_id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[report.status]}`}>
                                                {report.status}
                                            </span>
                                            <span className="text-xs font-medium capitalize text-gray-500">
                                                {report.target_type}
                                            </span>
                                        </div>
                                        {href ? (
                                            <Link href={href} className="mt-2 block text-lg font-semibold hover:text-primarypurple hover:underline">
                                                {label}
                                            </Link>
                                        ) : (
                                            <h2 className="mt-2 text-lg font-semibold">{label}</h2>
                                        )}
                                    </div>
                                    <time dateTime={report.created_at} className="text-xs text-gray-500">
                                        {formatDate(report.created_at)}
                                    </time>
                                </div>

                                <div className="text-sm text-gray-700">
                                    <p>
                                        <span className="font-semibold">Reason:</span>{" "}
                                        {reasonLabels[report.reason] ?? report.reason}
                                    </p>
                                    {report.details && (
                                        <p className="mt-2 whitespace-pre-wrap">{report.details}</p>
                                    )}
                                </div>

                                {report.resolution_notes && (
                                    <div className="rounded-lg bg-primarypurple/5 p-3 text-sm text-gray-700">
                                        <p className="font-semibold text-primarypurple">Moderator note</p>
                                        <p className="mt-1 whitespace-pre-wrap">{report.resolution_notes}</p>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {reports.hasNextPage && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => void reports.fetchNextPage()}
                        disabled={reports.isFetchingNextPage}
                        className="rounded-lg bg-primarypurple px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {reports.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
}
