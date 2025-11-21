import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DRF_BASE = process.env.DRF_API_BASE_URL || "http://localhost:8000";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
        try {
            await fetch(`${DRF_BASE}/api/auth/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

    const res = NextResponse.json({ success: true, message: "Logout successful" });
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
}