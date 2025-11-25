import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";
const DRF_USER_SEARCH_URL = `${DRF_BASE}/api/users/search/`;

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const access = cookieStore.get("access_token")?.value;

    if (!access) {
        return NextResponse.json(
            { detail: "Unauthenticated. Access token missing." },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const nuEmail = searchParams.get("nu_email")?.trim().toLowerCase() || "";

    const drfUrl = new URL(DRF_USER_SEARCH_URL);
    if (nuEmail) {
        drfUrl.searchParams.set("nu_email", nuEmail);
    }

    const drfRes = await fetch(drfUrl.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
        },
    });

    const drfBody = await drfRes.json().catch(() => null);

    if (!drfRes.ok) {
        return NextResponse.json(
            drfBody || { detail: "Failed to search users" },
            { status: drfRes.status }
        );
    }

    return NextResponse.json(drfBody, { status: 200 });
}
