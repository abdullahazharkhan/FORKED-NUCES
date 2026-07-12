import { NextRequest } from "next/server";

import {
    appendSearchParams,
    pickSearchParams,
    USER_LIST_QUERY_PARAMS,
} from "@/lib/pagination";
import { proxyAuthenticatedDjango } from "@/lib/server/djangoBff";

export async function GET(request: NextRequest) {
    const search = pickSearchParams(request.nextUrl.searchParams, [
        ...USER_LIST_QUERY_PARAMS,
        "nu_email",
    ]);
    const nuEmail = search.get("nu_email");
    if (nuEmail) search.set("nu_email", nuEmail.toLowerCase());

    return proxyAuthenticatedDjango(
        appendSearchParams("/api/auth/users/search/", search),
        { method: "GET" },
        "Failed to search users."
    );
}
