import {
    isNextResponse,
    parseJsonBody,
    proxyAuthenticatedDjango,
    rejectCrossOriginMutation,
} from "@/lib/server/djangoBff";

type Context = { params: Promise<{ projectid: string }> };

export async function GET(_request: Request, { params }: Context) {
    const { projectid } = await params;
    return proxyAuthenticatedDjango(
        `/api/projects/public/${projectid}/`,
        { method: "GET" },
        "Failed to fetch project."
    );
}

export async function PUT(request: Request, { params }: Context) {
    const { projectid } = await params;
    const body = await parseJsonBody<unknown>(request);
    if (isNextResponse(body)) return body;

    return proxyAuthenticatedDjango(
        `/api/projects/${projectid}/`,
        { method: "PUT", body: JSON.stringify(body) },
        "Failed to update project."
    );
}

export async function DELETE(request: Request, { params }: Context) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const { projectid } = await params;
    return proxyAuthenticatedDjango(
        `/api/projects/${projectid}/`,
        { method: "DELETE" },
        "Failed to delete project."
    );
}
