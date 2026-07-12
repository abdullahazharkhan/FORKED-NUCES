import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/server/authCookies";
import { REFRESH_COOKIE_NAME } from "@/lib/authCookieNames";
import {
    djangoRequest,
    forwardDjangoResponse,
    jsonHeaders,
    rejectCrossOriginMutation,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

type RefreshResult = { access?: string; refresh?: string };

export async function POST(request: Request) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const cookieStore = await cookies();
    const refresh = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!refresh) {
        return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
    }

    try {
        const result = await djangoRequest<RefreshResult>("/api/token/refresh/", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ refresh }),
        });

        if (!result.response.ok) {
            const response = forwardDjangoResponse(result, "Refresh failed");
            if (result.response.status === 401 || result.response.status === 403) {
                clearAuthCookies(response);
            }
            return response;
        }

        if (!result.body?.access) {
            return NextResponse.json(
                { detail: "The backend returned an invalid refresh response." },
                { status: 502 }
            );
        }

        const response = NextResponse.json({ success: true });
        setAuthCookies(response, result.body);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
