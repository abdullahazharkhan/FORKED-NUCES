import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userid: string }> }
) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    const { userid } = await params;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    const drfUrl = `${DRF_BASE}/api/auth/users/${userid}/`;

    const drfRes = await fetch(drfUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
    });

    const drfBody = await drfRes.json().catch(() => null);

    if (!drfRes.ok) {
        return NextResponse.json(
            drfBody || { detail: "Failed to fetch user" },
            { status: drfRes.status }
        );
    }

    return NextResponse.json(drfBody, { status: 200 });
}