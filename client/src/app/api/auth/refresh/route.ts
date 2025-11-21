// app/api/auth/refresh/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function POST() {
    const cookieStore = await cookies();
    const refresh = cookieStore.get("refresh_token")?.value;

    if (!refresh) {
        return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
    }

    const drfRes = await fetch(`${DRF_BASE}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (!drfRes.ok) {
        // Refresh failed (expired/blacklisted)
        const res = NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
        res.cookies.delete("access_token");
        res.cookies.delete("refresh_token");
        return res;
    }

    const data = await drfRes.json();

    const res = NextResponse.json({ success: true });

    res.cookies.set("access_token", data.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
    });

    return res;
}
