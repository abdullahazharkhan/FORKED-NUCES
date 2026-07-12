import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/server/authCookies";
import { REFRESH_COOKIE_NAME } from "@/lib/authCookieNames";
import {
    djangoRequest,
    forwardDjangoResponse,
    jsonHeaders,
    rejectCrossOriginMutation,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export async function POST(request: Request) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const cookieStore = await cookies();
    const refresh = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (refresh) {
        try {
            const result = await djangoRequest("/api/auth/logout/", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ refresh }),
            });

            // A 400 means Django confirmed that the refresh token is already unusable.
            if (!result.response.ok && result.response.status !== 400) {
                return forwardDjangoResponse(result, "Unable to complete logout.");
            }
        } catch (error) {
            // Keep the local refresh cookie so the user can retry server-side revocation.
            return upstreamErrorResponse(error);
        }
    }

    const response = NextResponse.json({ success: true, message: "Logout successful" });
    clearAuthCookies(response);
    return response;
}
