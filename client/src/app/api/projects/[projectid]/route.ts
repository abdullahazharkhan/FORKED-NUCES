import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectid: string }> }
) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    const { projectid } = await params;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    const drfUrl = `${DRF_BASE}/api/projects/public/${projectid}/`;

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
            drfBody || { detail: "Failed to fetch project" },
            { status: drfRes.status }
        );
    }

    return NextResponse.json(drfBody, { status: 200 });
}

export async function PUT(req: NextRequest,
    { params }: { params: Promise<{ projectid: string }> }) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    const { projectid } = await params;

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

    const { title, description, github_url, tags } = body as {
        title?: string;
        description?: string;
        github_url?: string;
        tags?: string[];
    };

    const drfRes = await fetch(`${DRF_BASE}/api/projects/${projectid}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ title, description, github_url, tags }),
    });

    if (!drfRes.ok) {
        const error = await drfRes.json();
        return NextResponse.json(error, { status: drfRes.status });
    }

    const data = await drfRes.json();

    const res = NextResponse.json({ data, success: true, message: "Profile updated successfully" });

    return res;
}
