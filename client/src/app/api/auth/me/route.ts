import {
    djangoRequest,
    forwardDjangoResponse,
    getAccessToken,
    jsonHeaders,
    unauthorizedResponse,
    upstreamErrorResponse,
} from "@/lib/server/djangoBff";

export async function GET() {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    try {
        const result = await djangoRequest("/api/auth/me/", {
            method: "GET",
            headers: jsonHeaders(access),
        });
        return forwardDjangoResponse(result, "Failed to fetch the current user.");
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
