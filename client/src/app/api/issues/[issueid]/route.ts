import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function PUT(req: NextRequest,
    { params }: { params: Promise<{ issueid: string }> }) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    const { issueid } = await params;

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

    const { title, description } = body as {
        title?: string;
        description?: string;
    };

    const drfRes = await fetch(`${DRF_BASE}/api/projects/issues/${issueid}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ title, description }),
    });

    if (!drfRes.ok) {
        const error = await drfRes.json();
        return NextResponse.json(error, { status: drfRes.status });
    }

    const updatedIssue = await drfRes.json();

    return NextResponse.json(updatedIssue, { status: 200 });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ issueid: string }> }
) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    const { issueid } = await params;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    const drfRes = await fetch(`${DRF_BASE}/api/projects/issues/${issueid}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
    });

    // DRF often returns 204 No Content on successful delete
    if (!drfRes.ok) {
        const error = await drfRes.json().catch(() => null);
        return NextResponse.json(
            error || { detail: "Failed to delete issue" },
            { status: drfRes.status }
        );
    }

    // If 204, there is no body to parse
    if (drfRes.status === 204) {
        return NextResponse.json(
            { success: true, message: "Project deleted successfully" },
            { status: 200 }
        );
    }

    const data = await drfRes.json().catch(() => null);

    return NextResponse.json(
        {
            data,
            success: true,
            message: "Project deleted successfully",
        },
        { status: 200 }
    );
}