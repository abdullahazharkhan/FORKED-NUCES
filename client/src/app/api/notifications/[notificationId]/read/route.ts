import {
    proxyAuthenticatedDjango,
    rejectCrossOriginMutation,
} from "@/lib/server/djangoBff";

type Context = { params: Promise<{ notificationId: string }> };

export async function POST(request: Request, { params }: Context) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    const { notificationId } = await params;
    return proxyAuthenticatedDjango(
        `/api/notifications/${notificationId}/read/`,
        { method: "POST", body: JSON.stringify({}) },
        "Failed to mark the notification as read."
    );
}
