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
            className="flex flex-col gap-4 rounded-2xl border border-red-200/80 bg-white/90 p-5 text-sm text-red-700 shadow-[0_14px_35px_rgba(185,28,28,0.08)] sm:flex-row sm:items-center sm:justify-between"
            role="alert"
        >
            <span className="flex items-start gap-3 font-medium">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 shadow-sm">
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="pt-2">{message}</span>
            </span>
            <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-700/80 bg-red-600 px-4 font-bold text-white shadow-[0_8px_20px_rgba(185,28,28,0.16)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_12px_24px_rgba(185,28,28,0.2)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
            >
                <RotateCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
                {isRetrying ? "Retrying..." : "Try again"}
            </button>
        </div>
    );
}
