import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pickPaginationHeaders } from "@/lib/pagination";
import { ACCESS_COOKIE_NAME } from "@/lib/authCookieNames";
import {
    validateSameOriginJsonRequest,
    validateSameOriginMutationRequest,
} from "@/lib/requestSecurity";

const DEFAULT_TIMEOUT_MS = 10_000;

export class DjangoUpstreamError extends Error {
    constructor(
        public readonly status: 502 | 504,
        message: string
    ) {
        super(message);
        this.name = "DjangoUpstreamError";
    }
}

export type DjangoResult<T = unknown> = {
    response: Response;
    body: T | null;
};

export function getDjangoBaseUrl(): string {
    const configured = process.env.DRF_API_BASE_URL?.trim();
    const raw = configured || (process.env.NODE_ENV !== "production" ? "http://localhost:8000" : "");

    if (!raw) {
        throw new DjangoUpstreamError(502, "The backend service is not configured.");
    }

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new DjangoUpstreamError(502, "The backend service URL is invalid.");
    }

    return url.toString().replace(/\/$/, "");
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

async function fetchDjangoResponse(
    path: string,
    init: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    const baseUrl = getDjangoBaseUrl();
    const url = `${baseUrl}/${path.replace(/^\//, "")}`;
    const safeRoute = `/${path.replace(/^\//, "").split("?", 1)[0]}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const upstreamSignal = init.signal;
    const abortFromUpstream = () => controller.abort();
    const headers = new Headers(init.headers);
    const requestId = headers.get("x-request-id") ?? randomUUID();
    headers.set("x-request-id", requestId);
    const startedAt = Date.now();

    if (upstreamSignal) {
        if (upstreamSignal.aborted) controller.abort();
        else upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    }

    try {
        console.log(JSON.stringify({
            level: "info",
            message: "django_upstream_start",
            method: init.method ?? "GET",
            route: safeRoute,
            request_id: requestId,
        }));
        const response = await fetch(url, {
            ...init,
            headers,
            cache: "no-store",
            signal: controller.signal,
        });
        console.log(JSON.stringify({
            level: "info",
            message: "django_upstream_done",
            method: init.method ?? "GET",
            route: safeRoute,
            request_id: requestId,
            status: response.status,
            duration_ms: Date.now() - startedAt,
        }));
        return response;
    } catch (error) {
        const status = controller.signal.aborted ? 504 : 502;
        console.error(JSON.stringify({
            level: "error",
            message: "django_upstream_failed",
            method: init.method ?? "GET",
            route: safeRoute,
            request_id: requestId,
            status,
            duration_ms: Date.now() - startedAt,
            error: error instanceof Error ? error.message : "Unknown error",
        }));
        if (controller.signal.aborted) {
            throw new DjangoUpstreamError(504, "The backend service timed out.");
        }
        throw new DjangoUpstreamError(502, "The backend service is unavailable.");
    } finally {
        clearTimeout(timeout);
        upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
}

export async function djangoRawRequest(
    path: string,
    init: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    return fetchDjangoResponse(path, init, timeoutMs);
}

export async function djangoRequest<T = unknown>(
    path: string,
    init: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<DjangoResult<T>> {
    const response = await fetchDjangoResponse(path, init, timeoutMs);
    const body = await readJsonSafely<T>(response);
    return { response, body };
}

export function upstreamErrorResponse(error: unknown): NextResponse {
    if (error instanceof DjangoUpstreamError) {
        return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    console.error(JSON.stringify({
        level: "error",
        message: "unexpected_bff_error",
        error: error instanceof Error ? error.message : "Unknown error",
    }));
    return NextResponse.json({ detail: "An unexpected server error occurred." }, { status: 500 });
}

export function forwardDjangoResponse(
    result: DjangoResult,
    fallbackDetail = "The backend returned an invalid response."
): NextResponse {
    const headers = pickPaginationHeaders(result.response.headers);
    const requestId = result.response.headers.get("x-request-id");
    if (requestId) headers.set("X-Request-ID", requestId);

    if (result.response.status === 204) {
        return new NextResponse(null, { status: 204, headers });
    }

    if (result.body === null && result.response.ok) {
        return NextResponse.json({ detail: fallbackDetail }, { status: 502 });
    }

    const body = result.body ?? { detail: fallbackDetail };
    return NextResponse.json(body, {
        status: result.response.status,
        headers,
    });
}

export async function getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;
}

export function unauthorizedResponse(): NextResponse {
    return NextResponse.json(
        { detail: "Unauthenticated. Access token missing." },
        { status: 401 }
    );
}

export function jsonHeaders(accessToken?: string): HeadersInit {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
}

export function rejectCrossOriginMutation(request: Request): NextResponse | null {
    const rejection = validateSameOriginMutationRequest(request);
    if (!rejection) return null;

    return NextResponse.json(
        { detail: rejection.detail },
        { status: rejection.status }
    );
}

export async function parseJsonBody<T>(request: Request): Promise<T | NextResponse> {
    const rejection = validateSameOriginJsonRequest(request);
    if (rejection) {
        return NextResponse.json(
            { detail: rejection.detail },
            { status: rejection.status }
        );
    }

    try {
        return (await request.json()) as T;
    } catch {
        return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
    }
}

export function isNextResponse(value: unknown): value is NextResponse {
    return value instanceof NextResponse;
}

export async function proxyAuthenticatedDjango(
    path: string,
    init: RequestInit = {},
    fallbackDetail?: string
): Promise<NextResponse> {
    const access = await getAccessToken();
    if (!access) return unauthorizedResponse();

    const headers = new Headers(jsonHeaders(access));
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    try {
        const result = await djangoRequest(path, { ...init, headers });
        return forwardDjangoResponse(result, fallbackDetail);
    } catch (error) {
        return upstreamErrorResponse(error);
    }
}
