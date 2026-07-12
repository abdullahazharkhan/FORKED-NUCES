import { NextResponse } from "next/server";

import {
    djangoRequest,
    forwardDjangoResponse,
    getAccessToken,
    isNextResponse,
    jsonHeaders,
    parseJsonBody,
    unauthorizedResponse,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export async function PUT(request: Request) {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    try {
        const result = await djangoRequest("/api/auth/me/update/", {
            method: "PUT",
            headers: jsonHeaders(access),
            body: JSON.stringify(body),
        });

        if (!result.response.ok) return forwardDjangoResponse(result, "Profile update failed.");
        if (!result.body) {
            return NextResponse.json({ detail: "The backend returned an invalid response." }, { status: 502 });
        }

        return NextResponse.json({
            data: result.body,
            success: true,
            message: "Profile updated successfully",
        });
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
