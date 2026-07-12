import {
    proxyAuthenticatedDjango,
    rejectCrossOriginMutation,
} from "@/lib/server/djangoBff";

export async function POST(request: Request) {
    const rejection = rejectCrossOriginMutation(request);
    if (rejection) return rejection;

    return proxyAuthenticatedDjango(
        "/api/notifications/mark-all-read/",
        { method: "POST", body: JSON.stringify({}) },
        "Failed to mark notifications as read."
    );
}
