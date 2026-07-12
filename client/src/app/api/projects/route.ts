import { NextRequest } from "next/server";

import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
} from "@/lib/server/djangoBff";
import {
    appendSearchParams,
    pickSearchParams,
    PROJECT_LIST_QUERY_PARAMS,
} from "@/lib/pagination";

export async function GET(request: NextRequest) {
    const path = appendSearchParams(
        "/api/projects/",
        pickSearchParams(request.nextUrl.searchParams, PROJECT_LIST_QUERY_PARAMS)
    );

    return proxyAuthenticatedDjango(
        path,
        { method: "GET" },
        "Failed to fetch projects."
    );
}

export async function POST(request: Request) {
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        "/api/projects/",
        { method: "POST", body: JSON.stringify(body) },
        "Failed to create project."
    );
}
