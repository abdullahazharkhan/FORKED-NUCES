import { NextResponse } from "next/server";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function POST(req: Request) {
    const body = await req.json();

    let drfRes: Response;
    try {
        drfRes = await fetch(`${DRF_BASE}/api/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err: any) {
        return NextResponse.json(
            { detail: "Failed to reach the backend: " + (err?.message || String(err)) },
            { status: 502 }
        );
    }

    const text = await drfRes.text();
    let data: any;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { detail: text };
    }

    return NextResponse.json(data, { status: drfRes.status });
}
