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
        const result = await djangoRequest("/api/auth/register/", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify(body),
        });
        return forwardDjangoResponse(result, "Registration failed.");
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
