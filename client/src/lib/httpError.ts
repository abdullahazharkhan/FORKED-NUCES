export class HttpResponseError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message);
        this.name = "HttpResponseError";
    }
}

export function isNotFoundError(error: unknown): boolean {
    return error instanceof HttpResponseError && error.status === 404;
}
