import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/server/authCookies";
import {
    djangoRequest,
    forwardDjangoResponse,
    isNextResponse,
    jsonHeaders,
    parseJsonBody,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

type LoginBody = { nu_email?: string; password?: string };
type LoginResult = {
    access?: string;
    refresh?: string;
    user?: unknown;
};

export async function POST(request: Request) {
    const body = await parseJsonBody<LoginBody>(request);
    if (isNextResponse(body)) return body;

    if (!body.nu_email || !body.password) {
        return NextResponse.json(
            { detail: "Email and password are required." },
            { status: 400 }
        );
    }

    try {
        const result = await djangoRequest<LoginResult>("/api/auth/login/", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ nu_email: body.nu_email, password: body.password }),
        });

        if (!result.response.ok) return forwardDjangoResponse(result, "Login failed.");
        if (!result.body?.access || !result.body.refresh || !result.body.user) {
            return NextResponse.json(
                { detail: "The backend returned an invalid login response." },
                { status: 502 }
            );
        }

        const response = NextResponse.json({
            user: result.body.user,
            success: true,
            message: "Login successful",
        });
        setAuthCookies(response, result.body);
        return response;
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
