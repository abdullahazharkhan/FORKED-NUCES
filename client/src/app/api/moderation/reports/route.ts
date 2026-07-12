import { NextRequest } from "next/server";

import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
} from "@/lib/server/djangoBff";

export async function GET(request: NextRequest) {
    const allowed = new URLSearchParams();
    for (const key of ["limit", "offset"]) {
        const value = request.nextUrl.searchParams.get(key);
        if (value) allowed.set(key, value);
    }
    const query = allowed.toString();
    return proxyAuthenticatedDjango(
        `/api/moderation/reports/${query ? `?${query}` : ""}`,
        { method: "GET" },
        "Failed to load reports."
    );
}

export async function POST(request: Request) {
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;
    return proxyAuthenticatedDjango(
        "/api/moderation/reports/",
        { method: "POST", body: JSON.stringify(body) },
        "Failed to submit the report."
    );
}
