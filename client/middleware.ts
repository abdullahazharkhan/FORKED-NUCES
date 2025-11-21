import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only protect /dashboard and its subpaths
    const isProtected = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    const access = req.cookies.get("access_token")?.value;
    const refresh = req.cookies.get("refresh_token")?.value;

    // If no access and no refresh -> redirect to login
    if (!access && !refresh) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname); // optional, for redirect after login
        return NextResponse.redirect(loginUrl);
    }

    // If access exists, let through
    if (access) {
        return NextResponse.next();
    }

    // If only refresh exists (no access):
    // Option A (simple): redirect to login and let client-side refresh logic handle it.
    // Option B (advanced): call /api/auth/refresh here (requires Node.js runtime).
    // For simplicity, we just allow and rely on authFetch to refresh.
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
