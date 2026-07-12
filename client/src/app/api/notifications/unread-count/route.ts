import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET() {
    return proxyAuthenticatedDjango(
        "/api/notifications/unread-count/",
        { method: "GET" },
        "Failed to load the unread notification count."
    );
}
