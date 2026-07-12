import { NextRequest } from "next/server";

import {
    appendSearchParams,
    BASIC_LIST_QUERY_PARAMS,
    pickSearchParams,
} from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userid: string }> }
) {
    const { userid } = await params;
    const path = appendSearchParams(
        `/api/projects/by-user/${userid}/`,
        pickSearchParams(request.nextUrl.searchParams, BASIC_LIST_QUERY_PARAMS)
    );
    return proxyAuthenticatedDjango(
        path,
        { method: "GET" },
        "Failed to fetch projects."
    );
}
