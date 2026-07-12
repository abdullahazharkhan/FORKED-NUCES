import "server-only";

import { NextResponse } from "next/server";
import {
    ACCESS_COOKIE_NAME,
    LEGACY_ACCESS_COOKIE_NAME,
    LEGACY_REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
} from "@/lib/authCookieNames";

type TokenPayload = {
    access?: string;
    refresh?: string;
};

const commonCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

export function setAuthCookies(response: NextResponse, tokens: TokenPayload): void {
    if (tokens.access) {
        response.cookies.set(ACCESS_COOKIE_NAME, tokens.access, {
            ...commonCookieOptions,
            maxAge: 60 * 15,
        });
    }

    if (tokens.refresh) {
        response.cookies.set(REFRESH_COOKIE_NAME, tokens.refresh, {
            ...commonCookieOptions,
            maxAge: 60 * 60 * 24 * 7,
        });
    }
}

export function clearAuthCookies(response: NextResponse): void {
    const names = new Set([
        ACCESS_COOKIE_NAME,
        REFRESH_COOKIE_NAME,
        LEGACY_ACCESS_COOKIE_NAME,
        LEGACY_REFRESH_COOKIE_NAME,
    ]);
    for (const name of names) {
        response.cookies.set(name, "", {
            ...commonCookieOptions,
            maxAge: 0,
        });
    }
}
