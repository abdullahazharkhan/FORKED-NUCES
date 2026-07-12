import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET() {
    return proxyAuthenticatedDjango(
        "/api/projects/user-stats/",
        { method: "GET" },
        "Failed to load your activity statistics."
    );
}
