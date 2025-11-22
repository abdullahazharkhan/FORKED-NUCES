import { NextResponse } from "next/server";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function POST(req: Request) {
    const { nu_email, password } = await req.json();

    const drfRes = await fetch(`${DRF_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nu_email, password }),
    });

    if (!drfRes.ok) {
        const error = await drfRes.json();
        return NextResponse.json(error, { status: drfRes.status });
    }

    const data = await drfRes.json();

    const res = NextResponse.json({ user: data.user, success: true, message: "Login successful" });

    // Set cookies
    res.cookies.set("access_token", data.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 minutes
    });

    res.cookies.set("refresh_token", data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return res;
}
