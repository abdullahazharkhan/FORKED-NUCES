import { NextResponse } from "next/server";

import {
    djangoRawRequest,
    forwardDjangoResponse,
    getAccessToken,
    jsonHeaders,
    unauthorizedResponse,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export const maxDuration = 60;

export async function GET() {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    try {
        const upstream = await djangoRawRequest(
            "/api/auth/me/export/",
            {
                method: "GET",
                headers: jsonHeaders(access),
            },
            55_000
        );
        if (!upstream.ok) {
            const body = await upstream.json().catch(() => null);
            return forwardDjangoResponse(
                { response: upstream, body },
                "Unable to export account data."
            );
        }

        const headers = new Headers({
            "Cache-Control": upstream.headers.get("cache-control") ?? "no-store",
            "Content-Disposition":
                upstream.headers.get("content-disposition") ??
                'attachment; filename="forked-nuces-data.json"',
            "Content-Type": upstream.headers.get("content-type") ?? "application/json",
            Pragma: upstream.headers.get("pragma") ?? "no-cache",
        });
        const requestId = upstream.headers.get("x-request-id");
        if (requestId) headers.set("X-Request-ID", requestId);

        return new NextResponse(upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
