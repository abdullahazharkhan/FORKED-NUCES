import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    Check,
    CircleDot,
    GitFork,
} from "lucide-react";

const HERO_POINTS = [
    "NU-verified community",
    "Real projects, real contributions",
    "Every skill level welcome",
] as const;

const LEDGER_ITEMS = [
    {
        number: "01",
        title: "Add keyboard navigation",
        meta: "Good first issue",
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
        meta: "Docs / 45 min",
        state: "Ready",
    },
] as const;

const Hero = () => {
    return (
        <section
            aria-labelledby="hero-heading"
            className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_82%_16%,rgba(195,255,0,0.14),transparent_24rem),radial-gradient(circle_at_8%_86%,rgba(242,183,5,0.08),transparent_26rem),linear-gradient(145deg,#7043fe_0%,#5f34ed_62%,#542bdc_100%)] pb-14 pt-28 font-sans text-white sm:pt-32 lg:flex lg:min-h-[min(50rem,100svh)] lg:items-center lg:pb-7 lg:pt-24"
        >
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-15"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-36 top-8 h-96 w-96 rounded-full border border-white/[0.07]"
                aria-hidden="true"
            />

            <div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] lg:gap-10 xl:gap-16">
                    <div className="landing-fade-up max-w-[45rem]">
                        <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm sm:text-sm">
                            <GitFork className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                            Built by FASTians, for FASTians
                        </p>

                        <h1
                            id="hero-heading"
                            className="mt-6 text-balance text-5xl font-bold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[3.7rem] xl:text-[4.35rem]"
                        >
                            Great projects deserve to be{" "}
                            <span className="text-primarygreen">finished.</span>
                        </h1>

                        <p className="mt-6 max-w-[39rem] text-pretty text-base leading-7 text-white/90 sm:text-lg sm:leading-8 lg:text-base lg:leading-7">
                            Share what you&apos;re building, meet contributors who know the
                            missing piece, and turn collaboration into proof of your skills.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                                href="/get-started"
                                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-primarygreen px-6 text-sm font-bold text-black shadow-[0_14px_34px_rgba(195,255,0,0.18)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(195,255,0,0.24)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-12"
                            >
                                Start building together
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link
                                href="#usecases"
                                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-white/[0.07] px-6 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:border-white/40 hover:bg-white/[0.13] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-12"
                            >
                                See how it works
                            </Link>
                        </div>

                        <ul className="mt-7 grid gap-2 text-xs text-white/90 sm:grid-cols-3">
                            {HERO_POINTS.map((point) => (
                                <li
                                    key={point}
                                    className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm"
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

                    <div className="landing-fade-up landing-delay-2 relative mx-auto w-full max-w-[44rem] lg:ml-auto">
                        <div
                            className="absolute -inset-5 -z-10 rounded-[2.25rem] bg-primarygreen/[0.08] blur-2xl"
                            aria-hidden="true"
                        />
                        <article
                            aria-label="Example open project"
                            className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#fbfaff] text-[#17131f] shadow-[0_28px_75px_rgba(31,14,82,0.28)]"
                        >
                            <header className="flex items-center justify-between gap-5 bg-primarygreen px-5 py-3 sm:px-6">
                                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                                    <CircleDot className="h-4 w-4" aria-hidden="true" />
                                    Open project
                                </p>
                                <p className="font-mono text-xs font-bold tabular-nums">
                                    Project / 024
                                </p>
                            </header>

                            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-6 lg:p-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primarypurple">
                                        Student utility platform
                                    </p>
                                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] sm:text-4xl lg:text-3xl">
                                        Campus Navigator
                                    </h2>
                                    <p className="mt-2 max-w-lg text-sm leading-6 text-black/60">
                                        Accessible campus directions and smarter route suggestions
                                        for students finding their way around.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-primarypurple/10 bg-primarypurple/[0.055] px-4 py-3 sm:min-w-36 sm:block">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                                            Status
                                        </p>
                                        <p className="mt-1.5 flex items-center gap-2 text-sm font-bold">
                                            <span
                                                className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                                                aria-hidden="true"
                                            />
                                            Recruiting
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-black/60 sm:mt-3">
                                        Updated today
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 px-5 pb-4 sm:px-6 lg:px-5">
                                {["Next.js", "Django", "PostgreSQL"].map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-primarypurple/10 bg-primarypurple/[0.07] px-3 py-1.5 text-xs font-bold text-primarypurple"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <ol className="space-y-2 border-y border-black/[0.06] bg-[#f3f1f8] p-3 sm:p-4">
                                {LEDGER_ITEMS.map((item) => (
                                    <li
                                        key={item.number}
                                        className="group grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-xl border border-black/[0.07] bg-white px-3 py-3 shadow-[0_5px_16px_rgba(45,23,102,0.035)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primarypurple/20 hover:shadow-[0_9px_22px_rgba(45,23,102,0.08)] sm:grid-cols-[2.25rem_minmax(0,1fr)_6.5rem] sm:items-center sm:px-4 lg:py-2.5"
                                    >
                                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primarypurple/[0.08] font-mono text-xs font-bold text-primarypurple">
                                            {item.number}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold tracking-tight sm:text-base">
                                                {item.title}
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-black/60">
                                                {item.meta}
                                            </p>
                                        </div>
                                        <p className="col-start-2 inline-flex items-center gap-1.5 text-xs font-bold text-black/55 sm:col-auto sm:justify-self-end">
                                            {item.state}
                                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                        </p>
                                    </li>
                                ))}
                            </ol>

                            <footer className="flex flex-col gap-4 bg-[#21183a] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="grid h-10 w-10 place-items-center rounded-xl bg-primarypurple text-xs font-bold shadow-sm"
                                        aria-hidden="true"
                                    >
                                        AK
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Areeba joined the build</p>
                                        <p className="mt-0.5 text-xs text-white/70">
                                            Accessibility / Frontend
                                        </p>
                                    </div>
                                </div>
                                <p className="w-fit rounded-full bg-primarygreen/10 px-3 py-1.5 text-xs font-semibold text-primarygreen">
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
