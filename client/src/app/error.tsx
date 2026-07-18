"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";

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
        <main className="relative isolate flex min-h-svh items-center overflow-hidden bg-primarypurple px-5 py-16 text-white sm:px-8">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-30"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rotate-12 border-[3rem] border-primarygreen/15"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 -rotate-12 border-[3rem] border-white/10"
                aria-hidden="true"
            />

            <section
                role="alert"
                aria-labelledby="error-heading"
                className="landing-fade-up relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-white/25 bg-white p-6 text-black shadow-[0_24px_70px_rgba(22,9,60,0.34)] sm:p-10"
            >
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-red-50 text-red-600">
                    <CircleAlert className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-7 font-mono text-xs font-bold tracking-[0.16em] text-primarypurple">
                    Unexpected error
                </p>
                <h1
                    id="error-heading"
                    className="mt-3 text-balance text-3xl font-black tracking-[-0.04em] sm:text-5xl"
                >
                    Something went wrong.
                </h1>
                <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-black/60">
                    We could not load this page. Try the request again, or return home if
                    the problem continues.
                </p>

                {error.digest && (
                    <p className="mt-5 font-mono text-xs text-black/40">
                        Error reference: {error.digest}
                    </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primarypurple px-5 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-black/15 px-5 text-sm font-bold text-black transition-colors hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Return home
                    </Link>
                </div>
            </section>
        </main>
    );
}
