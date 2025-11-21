import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({ success: true, message: "Logout successful" });
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
}