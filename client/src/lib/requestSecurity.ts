export type MutationRequestRejection = {
    detail: string;
    status: 403 | 415;
};

function firstForwardedValue(value: string | null): string | null {
    const first = value?.split(",", 1)[0]?.trim();
    return first || null;
}

export function validateSameOriginMutationRequest(
    request: Pick<Request, "headers" | "url">
): MutationRequestRejection | null {
    const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
    if (fetchSite === "cross-site" || fetchSite === "same-site") {
        return { detail: "Cross-origin request rejected.", status: 403 };
    }

    const origin = request.headers.get("origin")?.trim();
    if (!origin) return null;

    try {
        const requestUrl = new URL(request.url);
        const externalHost =
            firstForwardedValue(request.headers.get("x-forwarded-host")) ??
            firstForwardedValue(request.headers.get("host")) ??
            requestUrl.host;
        const externalProtocol =
            firstForwardedValue(request.headers.get("x-forwarded-proto")) ??
            requestUrl.protocol.replace(/:$/, "");
        const expectedOrigin = `${externalProtocol.toLowerCase()}://${externalHost.toLowerCase()}`;

        if (new URL(origin).origin.toLowerCase() !== expectedOrigin) {
            return { detail: "Cross-origin request rejected.", status: 403 };
        }
    } catch {
        return { detail: "Cross-origin request rejected.", status: 403 };
    }

    return null;
}

export function validateSameOriginJsonRequest(
    request: Pick<Request, "headers" | "url">
): MutationRequestRejection | null {
    const mediaType = request.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase();
    if (mediaType !== "application/json") {
        return {
            detail: "Content-Type must be application/json.",
            status: 415,
        };
    }

    return validateSameOriginMutationRequest(request);
}
