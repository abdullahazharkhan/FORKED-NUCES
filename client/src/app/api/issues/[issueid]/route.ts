import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
    rejectCrossOriginMutation,
} from "@/lib/server/djangoBff";

type Context = { params: Promise<{ issueid: string }> };

export async function PUT(request: Request, { params }: Context) {
    const { issueid } = await params;
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        `/api/projects/issues/${issueid}/`,
        { method: "PUT", body: JSON.stringify(body) },
        "Failed to update issue."
    );
}

export async function DELETE(request: Request, { params }: Context) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const { issueid } = await params;
    return proxyAuthenticatedDjango(
        `/api/projects/issues/${issueid}/`,
        { method: "DELETE" },
        "Failed to delete issue."
    );
}
