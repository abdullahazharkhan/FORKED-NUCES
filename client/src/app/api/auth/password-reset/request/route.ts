import { NextResponse } from "next/server";

import {
    djangoRequest,
    forwardDjangoResponse,
    isNextResponse,
    jsonHeaders,
    parseJsonBody,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

type PasswordResetRequestBody = { nu_email?: string };

export async function POST(request: Request) {
    const body = await parseJsonBody<PasswordResetRequestBody>(request);
    if (isNextResponse(body)) return body;

    const nuEmail = body.nu_email?.trim().toLowerCase();
    if (!nuEmail) {
        return NextResponse.json(
            { nu_email: ["NU email is required."] },
            { status: 400 }
        );
    }

    try {
        const result = await djangoRequest(
            "/api/auth/password-reset/request/",
            {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ nu_email: nuEmail }),
            }
        );
        return forwardDjangoResponse(
            result,
            "Unable to request a password reset."
        );
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}

