import { NextRequest, NextResponse } from "next/server";

import { getSafeInternalPath } from "@/lib/safeRedirect";
import {
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
} from "@/lib/authCookieNames";

const PROTECTED_PATHS = [
    "/activity",
    "/leaderboard",
    "/platform",
    "/profile",
    "/notifications",
    "/collaborations",
];
const AUTH_PAGES = ["/login", "/get-started"];

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    const isAuthPage = AUTH_PAGES.some((path) =>
        pathname.startsWith(path)
    );

    const access = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const refresh = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

    const hasAccess = !!access;
    const hasRefresh = !!refresh;

    // If user is already logged in, don't let them visit /login or /get-started
    if (isAuthPage && (hasAccess || hasRefresh)) {
        const destination = getSafeInternalPath(
            req.nextUrl.searchParams.get("next")
        );
        return NextResponse.redirect(new URL(destination, req.url));
    }

    // Protect /platform routes: user must have at least access or refresh
    if (isProtected) {
        // If no access AND no refresh -> not logged in at all -> send to login
        if (!hasAccess && !hasRefresh) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = "/login";
            loginUrl.search = "";
            loginUrl.searchParams.set(
                "next",
                `${pathname}${req.nextUrl.search}`
            );
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
        "/activity/:path*",
        "/leaderboard/:path*",
        "/platform/:path*",
        "/login",
        "/get-started",
        "/profile/:path*",
        "/notifications/:path*",
        "/collaborations/:path*",
    ],
};
