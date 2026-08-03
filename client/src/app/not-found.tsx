import Link from "next/link";
import { ArrowLeft, Compass, SearchX } from "lucide-react";

export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-svh items-center overflow-hidden bg-primarypurple px-5 py-16 text-white sm:px-8">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-30"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full border-[3rem] border-primarygreen/15"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full border-[3rem] border-white/10"
                aria-hidden="true"
            />

            <section
                aria-labelledby="not-found-heading"
                className="landing-fade-up relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/25 bg-white p-6 text-black shadow-[0_28px_80px_rgba(22,9,60,0.30)] sm:p-10"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primarygreen text-black shadow-sm">
                        <SearchX className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <span className="font-jaro text-6xl leading-none text-primarypurple/20 sm:text-8xl">
                        404
                    </span>
                </div>

                <p className="mt-7 font-mono text-xs font-bold tracking-[0.16em] text-primarypurple">
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
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(111,67,254,0.20)] transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-[#5d32eb] hover:shadow-[0_14px_34px_rgba(111,67,254,0.26)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Return home
                    </Link>
                    <Link
                        href="/platform"
                        prefetch={false}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-black/[0.025] px-5 text-sm font-bold text-black transition-[background-color,border-color,transform] hover:border-primarypurple/20 hover:bg-primarypurple/[0.05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple active:translate-y-px"
                    >
                        <Compass className="h-4 w-4" aria-hidden="true" />
                        Explore projects
                    </Link>
                </div>
            </section>
        </main>
    );
}
