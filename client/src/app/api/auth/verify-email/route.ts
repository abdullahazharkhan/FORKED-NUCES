import {
    djangoRequest,
    forwardDjangoResponse,
    isNextResponse,
    jsonHeaders,
    parseJsonBody,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export async function POST(request: Request) {
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    try {
        const result = await djangoRequest("/api/auth/verify-email/", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify(body),
        });
        return forwardDjangoResponse(result, "Email verification failed.");
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
