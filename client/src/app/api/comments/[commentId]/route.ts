import {
    proxyAuthenticatedDjango,
    rejectCrossOriginMutation,
} from "@/lib/server/djangoBff";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const { commentId } = await params;
    return proxyAuthenticatedDjango(
        `/api/interactions/comments/${commentId}/`,
        { method: "DELETE" },
        "Failed to delete comment."
    );
}
