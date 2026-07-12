import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/server/authCookies";
import {
    djangoRequest,
    forwardDjangoResponse,
    isNextResponse,
    jsonHeaders,
    parseJsonBody,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

type PasswordResetConfirmBody = {
    uid?: string;
    token?: string;
    new_password?: string;
    confirm_password?: string;
};

export async function POST(request: Request) {
    const body = await parseJsonBody<PasswordResetConfirmBody>(request);
    if (isNextResponse(body)) return body;

    if (
        !body.uid ||
        !body.token ||
        !body.new_password ||
        !body.confirm_password
    ) {
        return NextResponse.json(
            { detail: "Reset token and both password fields are required." },
            { status: 400 }
        );
    }

    try {
        const result = await djangoRequest(
            "/api/auth/password-reset/confirm/",
            {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify(body),
            }
        );
        const response = forwardDjangoResponse(
            result,
            "Unable to reset the password."
        );
        if (response.ok) clearAuthCookies(response);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
