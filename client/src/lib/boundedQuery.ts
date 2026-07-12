export type BoundedIntegerOptions = {
    defaultValue: number;
    max: number;
    min?: number;
};

export type BoundedIntegerResult =
    | { ok: true; value: number }
    | { detail: string; ok: false };

export function readBoundedIntegerParam(
    searchParams: URLSearchParams,
    name: string,
    { defaultValue, max, min = 1 }: BoundedIntegerOptions
): BoundedIntegerResult {
    const values = searchParams.getAll(name);
    if (values.length === 0) return { ok: true, value: defaultValue };

    if (values.length !== 1) {
        return {
            detail: `${name} must be provided at most once.`,
            ok: false,
        };
    }

    const raw = values[0].trim();
    if (!/^\d+$/.test(raw)) {
        return {
            detail: `${name} must be a whole number between ${min} and ${max}.`,
            ok: false,
        };
    }

    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
        return {
            detail: `${name} must be a whole number between ${min} and ${max}.`,
            ok: false,
        };
    }

    return { ok: true, value };
}
