"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application route error", error);
    }, [error]);

    return (
        <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="text-gray-700">We could not load this page. Please try again.</p>
            <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-black/80"
            >
                Try again
            </button>
        </main>
    );
}
