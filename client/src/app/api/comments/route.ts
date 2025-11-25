import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

const DRF_COMMENTS_URL = `${DRF_BASE}/api/interactions/comments/`;

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { detail: "Invalid JSON body." },
            { status: 400 }
        );
    }

    const { project_id, comment_body } = body as {
        project_id?: string;
        comment_body?: string;
    };

    const drfRes = await fetch(DRF_COMMENTS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({
            project_id,
            comment_body,
        }),
    });

    const drfBody = await drfRes.json().catch(() => null);

    if (!drfRes.ok) {
        return NextResponse.json(
            drfBody || { detail: "Failed to create comment" },
            { status: drfRes.status }
        );
    }

    return NextResponse.json(drfBody, { status: 201 });
}
