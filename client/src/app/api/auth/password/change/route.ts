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

type PasswordChangeBody = {
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
};

export async function POST(request: Request) {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    const body = await parseJsonBody<PasswordChangeBody>(request);
    if (isNextResponse(body)) return body;

    if (
        !body.current_password ||
        !body.new_password ||
        !body.confirm_password
    ) {
        return NextResponse.json(
            { detail: "Current password and both new password fields are required." },
            { status: 400 }
        );
    }

    try {
        const result = await djangoRequest("/api/auth/password/change/", {
            method: "POST",
            headers: jsonHeaders(access),
            body: JSON.stringify(body),
        });
        const response = forwardDjangoResponse(
            result,
            "Unable to change the password."
        );
        if (response.ok) clearAuthCookies(response);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
