import Link from "next/link";
import { ArrowLeft, Compass, SearchX } from "lucide-react";

export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-primarypurple px-5 py-16 text-white sm:px-8">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-30"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primarygreen/20 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
                aria-hidden="true"
            />

            <section
                aria-labelledby="not-found-heading"
                className="landing-fade-up relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white p-6 text-black shadow-[0_32px_90px_rgba(22,9,60,0.4)] sm:p-10"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primarygreen/25 text-black">
                        <SearchX className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-5xl font-black tracking-[-0.08em] text-primarypurple/15 sm:text-7xl">
                        404
                    </span>
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-primarypurple">
                    Lost in the directory
                </p>
                <h1
                    id="not-found-heading"
                    className="mt-3 text-balance text-3xl font-black tracking-[-0.04em] sm:text-5xl"
                >
                    This page could not be found.
                </h1>
                <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-black/60">
                    The link may be outdated, or the page may have moved. Head home or
                    explore active student projects instead.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Return home
                    </Link>
                    <Link
                        href="/platform"
                        prefetch={false}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-black/15 px-5 text-sm font-bold text-black transition-colors hover:bg-black/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple"
                    >
                        <Compass className="h-4 w-4" aria-hidden="true" />
                        Explore projects
                    </Link>
                </div>
            </section>
        </main>
    );
}
