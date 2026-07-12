import { NextRequest } from "next/server";

import {
    appendSearchParams,
    COLLABORATION_REQUEST_QUERY_PARAMS,
    pickSearchParams,
} from "@/lib/pagination";
import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
} from "@/lib/server/djangoBff";

type Context = { params: Promise<{ issueid: string }> };

export async function GET(request: NextRequest, { params }: Context) {
    const { issueid } = await params;
    const path = appendSearchParams(
        `/api/projects/issues/${issueid}/collaboration-requests/`,
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

export async function POST(request: Request, { params }: Context) {
    const { issueid } = await params;
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        `/api/projects/issues/${issueid}/collaboration-requests/`,
        { method: "POST", body: JSON.stringify(body) },
        "Failed to create the collaboration request."
    );
}
