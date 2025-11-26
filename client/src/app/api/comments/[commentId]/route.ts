import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    const { commentId } = await params;

    const drfRes = await fetch(
        `${DRF_BASE}/api/interactions/comments/${commentId}/`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access}`,
            },
        }
    );

    const drfBody = await drfRes.json().catch(() => null);

    if (!drfRes.ok) {
        return NextResponse.json(
            drfBody || { detail: "Failed to delete comment" },
            { status: drfRes.status }
        );
    }

    return NextResponse.json(drfBody, { status: 200 });
}
