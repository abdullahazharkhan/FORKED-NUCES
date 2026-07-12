import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/server/authCookies";
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

type DeleteAccountPayload = {
    current_password?: string;
    confirmation?: string;
};

export async function POST(request: Request) {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    const payload = await parseJsonBody<DeleteAccountPayload>(request);
    if (isNextResponse(payload)) return payload;

    try {
        const result = await djangoRequest("/api/auth/me/delete/", {
            method: "POST",
            headers: jsonHeaders(access),
            body: JSON.stringify(payload),
        });
        if (!result.response.ok) {
            return forwardDjangoResponse(result, "Unable to delete the account.");
        }

        const response = NextResponse.json(
            result.body ?? {
                message: "Account deleted and personal profile data anonymized.",
            },
            { status: 200 }
        );
        clearAuthCookies(response);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
