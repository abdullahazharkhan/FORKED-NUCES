import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const HERO_POINTS = [
    "NU-verified community",
    "Real projects, real contributions",
    "Built for every skill level",
] as const;

const LEDGER_ITEMS = [
    {
        number: "01",
        title: "Add keyboard navigation",
        meta: "good first issue",
        state: "Open",
    },
    {
        number: "02",
        title: "Improve route matching",
        meta: "2 contributors",
        state: "In review",
    },
    {
        number: "03",
        title: "Document the map API",
        meta: "docs · 45 min",
        state: "Ready",
    },
] as const;

const Hero = () => {
    return (
        <section className="relative isolate min-h-[min(58rem,100dvh)] overflow-hidden bg-primarypurple pb-10 pt-28 font-sans text-white sm:pt-32 lg:flex lg:min-h-[52rem] lg:items-center lg:pb-16 lg:pt-36">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-25"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-x-0 top-20 border-t border-white/15"
                aria-hidden="true"
            />

            <div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
                <div className="mb-9 flex items-center justify-between gap-6 border-b border-white/20 pb-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
                    <p>FAST NUCES · Open collaboration network</p>
                    <p className="hidden font-mono tabular-nums sm:block">
                        Field note / 001
                    </p>
                </div>

                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.84fr)_minmax(32rem,1.16fr)] lg:gap-12 xl:gap-20">
                    <div className="landing-fade-up max-w-[48rem]">
                        <p className="mb-5 flex items-center gap-3 text-sm font-semibold text-white/90">
                            <span className="h-2 w-2 bg-primarygreen" aria-hidden="true" />
                            Built by FASTians, for FASTians
                        </p>

                        <h1 className="text-balance text-[clamp(3.7rem,8vw,7.6rem)] font-black leading-[0.83] tracking-[-0.07em]">
                            Great projects
                            <br />
                            deserve to be
                            <br />
                            <span className="text-primarygreen">finished.</span>
                        </h1>

                        <p className="mt-7 max-w-[39rem] text-pretty text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                            Share what you&apos;re building, find contributors who know the
                            missing piece, and turn every collaboration into proof of your
                            skills.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                                href="/get-started"
                                className="group inline-flex min-h-14 items-center justify-center gap-3 bg-primarygreen px-6 text-sm font-bold text-black transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            >
                                Start building together
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link
                                href="#usecases"
                                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-6 text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:border-white/70 hover:bg-white/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            >
                                Browse the field guide
                            </Link>
                        </div>

                        <ul className="mt-8 grid border-t border-white/20 text-xs text-white/90 sm:grid-cols-3">
                            {HERO_POINTS.map((point) => (
                                <li
                                    key={point}
                                    className="flex min-h-12 items-center gap-2 border-b border-white/15 py-3 sm:border-b-0 sm:border-r sm:px-3 first:sm:pl-0 last:sm:border-r-0"
                                >
                                    <Check
                                        className="h-3.5 w-3.5 shrink-0 text-primarygreen"
                                        strokeWidth={3}
                                        aria-hidden="true"
                                    />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="landing-fade-up landing-delay-2 relative lg:-translate-y-8">
                        <div
                            className="absolute -left-4 top-8 hidden h-[calc(100%-4rem)] w-4 border-y border-l border-primarygreen/70 lg:block"
                            aria-hidden="true"
                        />
                        <article
                            aria-label="Example open project ledger"
                            className="border border-white/25 bg-white text-black"
                        >
                            <header className="flex items-center justify-between gap-5 border-b border-black/15 bg-primarygreen px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:px-6 sm:text-xs">
                                <p>Open project ledger</p>
                                <p className="font-mono tabular-nums">Project / 024</p>
                            </header>

                            <div className="grid border-b border-black/15 sm:grid-cols-[1fr_auto]">
                                <div className="p-5 sm:p-7">
                                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-primarypurple sm:text-xs">
                                        Student utility platform
                                    </p>
                                    <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                                        Campus Navigator
                                    </h2>
                                    <p className="mt-3 max-w-lg text-sm leading-6 text-black/60">
                                        An accessible campus map with smarter route
                                        recommendations for new students.
                                    </p>
                                </div>
                                <div className="flex items-end justify-between gap-4 border-t border-black/15 px-5 py-4 sm:min-w-40 sm:flex-col sm:items-start sm:border-l sm:border-t-0 sm:px-6 sm:py-6">
                                    <div>
                                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-black/60">
                                            Status
                                        </p>
                                        <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                                            <span
                                                className="h-2 w-2 bg-primarypurple"
                                                aria-hidden="true"
                                            />
                                            Recruiting
                                        </p>
                                    </div>
                                    <p className="font-mono text-xs font-semibold text-black/60">
                                        Updated 14:32
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap border-b border-black/15 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-black/60 sm:text-xs">
                                {["Next.js", "Django", "PostgreSQL"].map((tag) => (
                                    <span
                                        key={tag}
                                        className="border-r border-black/15 px-4 py-3 last:border-r-0 sm:px-6"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <ol>
                                {LEDGER_ITEMS.map((item) => (
                                    <li
                                        key={item.number}
                                        className="group grid grid-cols-[2.2rem_minmax(0,1fr)] gap-x-3 border-b border-black/15 px-4 py-4 transition-colors duration-200 last:border-b-0 hover:bg-primarypurple/[0.055] sm:grid-cols-[2.5rem_minmax(0,1fr)_7rem] sm:items-center sm:px-6"
                                    >
                                        <span className="font-mono text-xs font-bold text-primarypurple">
                                            {item.number}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold tracking-tight sm:text-base">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-black/60">
                                                {item.meta}
                                            </p>
                                        </div>
                                        <p className="col-start-2 mt-2 text-xs font-bold text-black/55 sm:col-auto sm:mt-0 sm:text-right">
                                            {item.state} <span aria-hidden="true">↗</span>
                                        </p>
                                    </li>
                                ))}
                            </ol>

                            <footer className="flex flex-col gap-4 border-t border-black bg-black px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="grid h-10 w-10 place-items-center bg-primarypurple text-xs font-black"
                                        aria-hidden="true"
                                    >
                                        AK
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Areeba joined the build</p>
                                        <p className="mt-0.5 text-xs text-white/70">
                                            accessibility · frontend
                                        </p>
                                    </div>
                                </div>
                                <p className="font-mono text-xs font-semibold text-primarygreen">
                                    Contribution accepted
                                </p>
                            </footer>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
