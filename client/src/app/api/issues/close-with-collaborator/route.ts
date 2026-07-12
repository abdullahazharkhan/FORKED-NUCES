import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
} from "@/lib/server/djangoBff";

export async function POST(request: Request) {
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        "/api/projects/issues/close-with-collaborator/",
        { method: "POST", body: JSON.stringify(body) },
        "Failed to close issue."
    );
}
