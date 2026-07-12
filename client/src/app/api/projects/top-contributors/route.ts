import { NextRequest, NextResponse } from "next/server";

import { readBoundedIntegerParam } from "@/lib/boundedQuery";
import { appendSearchParams } from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
    const limit = readBoundedIntegerParam(
        request.nextUrl.searchParams,
        "limit",
        { defaultValue: DEFAULT_LIMIT, max: MAX_LIMIT }
    );
    if (!limit.ok) {
        return NextResponse.json({ detail: limit.detail }, { status: 400 });
    }

    const searchParams = new URLSearchParams({ limit: String(limit.value) });
    return proxyAuthenticatedDjango(
        appendSearchParams("/api/projects/top-contributors/", searchParams),
        { method: "GET" },
        "Failed to load the contributor leaderboard."
    );
}
