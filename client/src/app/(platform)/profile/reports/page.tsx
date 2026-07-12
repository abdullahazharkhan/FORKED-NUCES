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
import { PlatformPageHeader } from "@/app/(platform)/components/PlatformPageHeader";
import {
    PLATFORM_HEADER_BADGE_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
} from "@/lib/platformStyles";

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
        <div className="mx-auto max-w-5xl space-y-7">
            <PlatformPageHeader
                eyebrow="Trust & safety"
                title={<>Your submitted <span className="text-primarygreen">reports.</span></>}
                description="Track every concern you have shared with moderators and see when it has been reviewed or resolved."
                actions={
                    <div className={PLATFORM_HEADER_BADGE_CLASS}>
                        <ClipboardList className="h-6 w-6 text-primarygreen" aria-hidden="true" />
                        <span className="text-sm font-bold">
                            {typeof totalCount === "number" ? `${totalCount} submitted` : "Moderation center"}
                        </span>
                    </div>
                }
            />

            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primarypurple">Report history</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Status updates</h2>
                </div>
                <Link href="/profile" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primarypurple shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15">
                    Back to profile
                </Link>
            </div>

            {reports.isPending && (
                <div className="space-y-3" role="status" aria-label="Loading submitted reports">
                    {reportSkeletonIds.map((id) => (
                        <div key={id} className="h-40 animate-pulse rounded-3xl border border-black/[0.06] bg-white" />
                    ))}
                </div>
            )}

            {reports.isError && (
                <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
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
                        className="font-bold underline underline-offset-4 disabled:opacity-60"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!reports.isPending && !reports.isError && items.length === 0 && (
                <div className="rounded-3xl border border-dashed border-primarypurple/25 bg-white p-12 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primarypurple/[0.08] text-primarypurple">
                        <ClipboardList className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-lg font-black">You have not submitted any reports.</p>
                    <p className="mt-1 text-sm text-black/50">
                        Reports created from project or user pages will appear here.
                    </p>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-4">
                    <p className="text-xs font-medium text-black/45" aria-live="polite">
                        Showing {items.length}
                        {typeof totalCount === "number" ? ` of ${totalCount}` : ""}
                    </p>
                    {items.map((report) => {
                        const href = reportLink(report);
                        const label = reportLabel(report);
                        return (
                            <article key={report.report_id} className="space-y-4 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_16px_45px_rgba(24,15,48,0.05)] sm:p-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[report.status]}`}>
                                                {report.status}
                                            </span>
                                            <span className="text-xs font-bold capitalize text-black/40">
                                                {report.target_type}
                                            </span>
                                        </div>
                                        {href ? (
                                            <Link href={href} className="mt-2 block text-xl font-black tracking-tight transition hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15">
                                                {label}
                                            </Link>
                                        ) : (
                                            <h2 className="mt-2 text-xl font-black tracking-tight">{label}</h2>
                                        )}
                                    </div>
                                    <time dateTime={report.created_at} className="text-xs font-medium text-black/40">
                                        {formatDate(report.created_at)}
                                    </time>
                                </div>

                                <div className="text-sm leading-6 text-black/65">
                                    <p>
                                        <span className="font-semibold">Reason:</span>{" "}
                                        {reasonLabels[report.reason] ?? report.reason}
                                    </p>
                                    {report.details && (
                                        <p className="mt-2 whitespace-pre-wrap">{report.details}</p>
                                    )}
                                </div>

                                {report.resolution_notes && (
                                    <div className="rounded-2xl border border-primarypurple/10 bg-primarypurple/[0.05] p-4 text-sm text-black/65">
                                        <p className="font-black text-primarypurple">Moderator note</p>
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
                        className={PLATFORM_PRIMARY_BUTTON_CLASS}
                    >
                        {reports.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
}
