import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/server/authCookies";
import {
    djangoRequest,
    forwardDjangoResponse,
    getAccessToken,
    jsonHeaders,
    rejectCrossOriginMutation,
    unauthorizedResponse,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export async function POST(request: Request) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    try {
        const result = await djangoRequest("/api/auth/logout-all/", {
            method: "POST",
            headers: jsonHeaders(access),
        });

        if (!result.response.ok) {
            return forwardDjangoResponse(result, "Unable to sign out all devices.");
        }

        const response = new NextResponse(null, { status: 205 });
        clearAuthCookies(response);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
