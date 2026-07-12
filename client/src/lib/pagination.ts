export const PAGINATION_RESPONSE_HEADERS = [
    "Link",
    "X-Total-Count",
    "X-Limit",
    "X-Offset",
] as const;

export const PROJECT_LIST_QUERY_PARAMS = [
    "search",
    "tag",
    "issue_status",
    "ordering",
    "limit",
    "offset",
] as const;

export const USER_LIST_QUERY_PARAMS = [
    "search",
    "skill",
    "ordering",
    "limit",
    "offset",
] as const;

export const COMMENT_LIST_QUERY_PARAMS = ["limit", "offset"] as const;
export const COLLABORATION_REQUEST_QUERY_PARAMS = [
    "status",
    "limit",
    "offset",
] as const;
export const RECOMMENDATION_QUERY_PARAMS = [
    "mode",
    "limit",
    "offset",
] as const;
export const BASIC_LIST_QUERY_PARAMS = ["limit", "offset"] as const;

export type PaginationMeta = {
    limit: number | null;
    nextOffset: number | null;
    offset: number;
    totalCount: number | null;
};

export type PaginatedPage<T> = PaginationMeta & {
    items: T[];
};

function parseNonNegativeInteger(value: string | null): number | null {
    if (value === null || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
}

export function pickPaginationHeaders(source: Headers): Headers {
    const forwarded = new Headers();

    PAGINATION_RESPONSE_HEADERS.forEach((name) => {
        const value = source.get(name);
        if (value !== null) forwarded.set(name, value);
    });

    return forwarded;
}

export function parseLinkHeader(value: string | null): Record<string, string> {
    if (!value) return {};

    const links: Record<string, string> = {};
    const matcher = /<([^>]+)>\s*;\s*rel="?([^";,]+)"?/g;
    let match: RegExpExecArray | null;

    while ((match = matcher.exec(value)) !== null) {
        links[match[2]] = match[1];
    }

    return links;
}

function offsetFromLink(link: string | undefined): number | null {
    if (!link) return null;

    try {
        const url = new URL(link, "http://pagination.local");
        return parseNonNegativeInteger(url.searchParams.get("offset"));
    } catch {
        return null;
    }
}

export function readPaginationMeta(
    headers: Headers,
    receivedCount: number
): PaginationMeta {
    const totalCount = parseNonNegativeInteger(headers.get("X-Total-Count"));
    const parsedLimit = parseNonNegativeInteger(headers.get("X-Limit"));
    const headerLimit = parsedLimit !== null && parsedLimit > 0 ? parsedLimit : null;
    const offset = parseNonNegativeInteger(headers.get("X-Offset")) ?? 0;
    const linkedOffset = offsetFromLink(
        parseLinkHeader(headers.get("Link")).next
    );
    const nextFromLink =
        linkedOffset !== null && linkedOffset > offset ? linkedOffset : null;
    const limit = headerLimit ?? (receivedCount > 0 ? receivedCount : null);

    let nextOffset = nextFromLink;
    if (
        nextOffset === null &&
        totalCount !== null &&
        limit !== null &&
        receivedCount > 0 &&
        offset + receivedCount < totalCount
    ) {
        nextOffset = offset + limit;
    }

    return { limit, nextOffset, offset, totalCount };
}

export async function readPaginatedArray<T>(
    response: Response
): Promise<PaginatedPage<T>> {
    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) {
        throw new Error("The server returned an invalid paginated response.");
    }

    return {
        items: body as T[],
        ...readPaginationMeta(response.headers, body.length),
    };
}

export function pickSearchParams(
    source: URLSearchParams,
    allowedNames: readonly string[]
): URLSearchParams {
    const selected = new URLSearchParams();

    allowedNames.forEach((name) => {
        const value = source.get(name);
        const trimmed = value?.trim();
        if (trimmed) selected.set(name, trimmed);
    });

    return selected;
}

export function appendSearchParams(
    path: string,
    searchParams: URLSearchParams
): string {
    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
}
