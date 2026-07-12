export const LEGACY_ACCESS_COOKIE_NAME = "access_token";
export const LEGACY_REFRESH_COOKIE_NAME = "refresh_token";

export function getAuthCookieNames(environment = process.env.NODE_ENV) {
    const hostPrefix = environment === "production" ? "__Host-" : "";
    return {
        access: `${hostPrefix}forked_access_token`,
        refresh: `${hostPrefix}forked_refresh_token`,
    } as const;
}

const authCookieNames = getAuthCookieNames();

export const ACCESS_COOKIE_NAME = authCookieNames.access;
export const REFRESH_COOKIE_NAME = authCookieNames.refresh;
