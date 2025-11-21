import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/platform"];
const AUTH_PAGES = ["/login", "/get-started"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    const isAuthPage = AUTH_PAGES.some((path) =>
        pathname.startsWith(path)
    );

    const access = req.cookies.get("access_token")?.value;
    const refresh = req.cookies.get("refresh_token")?.value;

    const hasAccess = !!access;
    const hasRefresh = !!refresh;

    // If user is already logged in, don't let them visit /login or /get-started
    if (isAuthPage && (hasAccess || hasRefresh)) {
        const platformUrl = req.nextUrl.clone();
        platformUrl.pathname = "/platform";
        return NextResponse.redirect(platformUrl);
    }

    // Protect /platform routes: user must have at least access or refresh
    if (isProtected) {
        // If no access AND no refresh -> not logged in at all -> send to login
        if (!hasAccess && !hasRefresh) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = "/login";
            return NextResponse.redirect(loginUrl);
        }

        // If hasAccess OR hasRefresh, allow request to proceed.
        return NextResponse.next();
    }

    // For all other routes, do nothing
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/platform/:path*",
        "/login",           
        "/get-started",     
    ],
};
