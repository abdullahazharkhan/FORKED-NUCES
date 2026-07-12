import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
} from "@/lib/server/djangoBff";

type Context = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, { params }: Context) {
    const { requestId } = await params;
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        `/api/projects/collaboration-requests/${requestId}/`,
        { method: "PATCH", body: JSON.stringify(body) },
        "Failed to update the collaboration request."
    );
}
