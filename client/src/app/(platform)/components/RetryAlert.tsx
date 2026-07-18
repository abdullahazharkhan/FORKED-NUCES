import { AlertCircle, RotateCcw } from "lucide-react";

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
            className="flex flex-col gap-4 border-y border-r border-red-200 border-l-4 border-l-red-600 bg-white p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
        >
            <span className="flex items-start gap-3 font-medium">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50">
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="pt-2">{message}</span>
            </span>
            <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-red-700 bg-red-600 px-4 font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
            >
                <RotateCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
                {isRetrying ? "Retrying..." : "Try again"}
            </button>
        </div>
    );
}
