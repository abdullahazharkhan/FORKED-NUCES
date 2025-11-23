import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function PUT(req: Request) {
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

    const { full_name, bio, skills } = body as {
        full_name?: string;
        bio?: string;
        skills?: string[];
    };

    const drfRes = await fetch(`${DRF_BASE}/api/auth/me/update/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ full_name, bio, skills }),
    });

    if (!drfRes.ok) {
        const error = await drfRes.json();
        return NextResponse.json(error, { status: drfRes.status });
    }

    const data = await drfRes.json();

    const res = NextResponse.json({ data, success: true, message: "Profile updated successfully" });

    return res;
}
