type JsonRecord = Record<string, unknown>;

const preferredErrorKeys = [
    "detail",
    "message",
    "non_field_errors",
    "nu_email",
    "current_password",
    "new_password",
    "confirm_password",
    "uid",
    "token",
];

function firstMessage(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value;

    if (Array.isArray(value)) {
        for (const item of value) {
            const message = firstMessage(item);
            if (message) return message;
        }
        return null;
    }

    if (value && typeof value === "object") {
        const record = value as JsonRecord;
        const keys = [
            ...preferredErrorKeys.filter((key) => key in record),
            ...Object.keys(record).filter(
                (key) => !preferredErrorKeys.includes(key)
            ),
        ];

        for (const key of keys) {
            const message = firstMessage(record[key]);
            if (message) return message;
        }
    }

    return null;
}

export class AuthFormResponseError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message);
        this.name = "AuthFormResponseError";
    }
}

export async function readAuthResponse<T>(
    response: Response,
    fallbackMessage: string
): Promise<T | null> {
    const body = (await response.json().catch(() => null)) as T | null;
    if (!response.ok) {
        throw new AuthFormResponseError(
            firstMessage(body) ?? fallbackMessage,
            response.status
        );
    }
    return body;
}

export function getAuthFormErrorMessage(
    error: unknown,
    fallbackMessage: string
): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallbackMessage;
}

