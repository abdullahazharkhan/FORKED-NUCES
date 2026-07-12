import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ userid: string }> }
) {
    const { userid } = await params;
    return proxyAuthenticatedDjango(
        `/api/auth/users/${userid}/`,
        { method: "GET" },
        "Failed to fetch user."
    );
}
