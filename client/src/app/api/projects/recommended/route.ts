import { NextRequest } from "next/server";

import {
    appendSearchParams,
    pickSearchParams,
    RECOMMENDATION_QUERY_PARAMS,
} from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

const allowedModes = new Set([
    "spotlight",
    "with-issues",
    "without-issues",
    "skill-match",
    "network",
]);

export async function GET(request: NextRequest) {
    const requestedMode = request.nextUrl.searchParams.get("mode") || "spotlight";
    const mode = allowedModes.has(requestedMode) ? requestedMode : "spotlight";
    const search = pickSearchParams(
        request.nextUrl.searchParams,
        RECOMMENDATION_QUERY_PARAMS
    );
    search.set("mode", mode);

    return proxyAuthenticatedDjango(
        appendSearchParams("/api/projects/recommended/", search),
        { method: "GET" },
        "Failed to fetch recommended projects."
    );
}
