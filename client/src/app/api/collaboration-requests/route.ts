import { NextRequest } from "next/server";

import {
    appendSearchParams,
    COLLABORATION_REQUEST_QUERY_PARAMS,
    pickSearchParams,
} from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(request: NextRequest) {
    const path = appendSearchParams(
        "/api/projects/collaboration-requests/mine/",
        pickSearchParams(
            request.nextUrl.searchParams,
            COLLABORATION_REQUEST_QUERY_PARAMS
        )
    );
    return proxyAuthenticatedDjango(
        path,
        { method: "GET" },
        "Failed to load collaboration requests."
    );
}
