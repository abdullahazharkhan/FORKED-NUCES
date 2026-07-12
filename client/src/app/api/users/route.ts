import { NextRequest } from "next/server";

import {
    appendSearchParams,
    pickSearchParams,
    USER_LIST_QUERY_PARAMS,
} from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(request: NextRequest) {
    const path = appendSearchParams(
        "/api/auth/users/",
        pickSearchParams(request.nextUrl.searchParams, USER_LIST_QUERY_PARAMS)
    );

    return proxyAuthenticatedDjango(
        path,
        { method: "GET" },
        "Failed to fetch users."
    );
}
