import { NextRequest } from "next/server";

import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(request: NextRequest) {
    const allowed = new URLSearchParams();
    for (const key of ["unread", "limit", "offset"]) {
        const value = request.nextUrl.searchParams.get(key);
        if (value) allowed.set(key, value);
    }
    const query = allowed.toString();
    return proxyAuthenticatedDjango(
        `/api/notifications/${query ? `?${query}` : ""}`,
        { method: "GET" },
        "Failed to load notifications."
    );
}
