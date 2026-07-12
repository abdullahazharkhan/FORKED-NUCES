type RetryAlertProps = {
    error: unknown;
    fallbackMessage: string;
    isRetrying: boolean;
    onRetry: () => void;
};

export function RetryAlert({
    error,
    fallbackMessage,
    isRetrying,
    onRetry,
}: RetryAlertProps) {
    const message =
        error instanceof Error && error.message.trim()
            ? error.message
            : fallbackMessage;

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
        >
            <span>{message}</span>
            <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold transition hover:bg-red-100 disabled:opacity-60"
            >
                {isRetrying ? "Retrying..." : "Try again"}
            </button>
        </div>
    );
}
