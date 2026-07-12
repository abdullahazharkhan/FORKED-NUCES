import Link from "next/link";
import {
    ArrowRight,
    Check,
    CircleDot,
    Code2,
    GitFork,
    Search,
    Sparkles,
    Users,
} from "lucide-react";

const HERO_POINTS = [
    "NU-verified community",
    "Real projects, real contributions",
    "Built for every skill level",
] as const;

const Hero = () => {
    return (
        <section className="relative isolate min-h-[92svh] overflow-hidden bg-primarypurple pb-20 pt-32 text-white sm:pt-36 lg:flex lg:items-center lg:pb-24">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-30"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-primarygreen/20 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-white/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                <div className="landing-fade-up max-w-3xl">
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm sm:text-sm">
                        <Sparkles className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                        Built by FASTians, for FASTians
                    </div>

                    <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.4rem]">
                        Great projects deserve to be
                        <span className="relative ml-3 inline-block text-primarygreen sm:ml-4">
                            finished.
                            <span
                                className="absolute -bottom-1 left-0 h-1.5 w-full -rotate-1 rounded-full bg-primarygreen/35"
                                aria-hidden="true"
                            />
                        </span>
                    </h1>

                    <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                        Share what you&apos;re building, find contributors who know the
                        missing piece, and turn every collaboration into proof of your
                        skills.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link
                            href="/get-started"
                            className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primarygreen px-6 text-base font-bold text-black shadow-[0_14px_40px_rgba(195,255,0,0.25)] transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Start building together
                            <ArrowRight
                                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                aria-hidden="true"
                            />
                        </Link>
                        <Link
                            href="#usecases"
                            className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            See how it works
                        </Link>
                    </div>

                    <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/70">
                        {HERO_POINTS.map((point) => (
                            <li key={point} className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primarygreen text-black">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="landing-fade-up landing-delay-2 relative mx-auto w-full max-w-xl lg:mx-0">
                    <div
                        className="absolute -inset-5 rotate-2 rounded-[2rem] border border-white/15 bg-white/5"
                        aria-hidden="true"
                    />
                    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/20 bg-[#f8f8fb] p-3 text-black shadow-[0_32px_90px_rgba(22,9,60,0.38)] sm:p-4">
                        <div className="flex items-center justify-between px-2 pb-3 pt-1">
                            <div className="flex items-center gap-1.5" aria-hidden="true">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-primaryyellow" />
                                <span className="h-2.5 w-2.5 rounded-full bg-primarygreen" />
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold text-black/55">
                                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                                Explore projects
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primarypurple text-white">
                                        <Code2 className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold sm:text-base">
                                            Campus Navigator
                                        </p>
                                        <p className="text-xs text-black/50">Student utility platform</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-primarygreen/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                                    3 open issues
                                </span>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-black/60">
                                Help us ship an accessible campus map and smarter route
                                recommendations for new students.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Next.js', 'Django', 'PostgreSQL'].map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-md border border-black/10 bg-black/[0.025] px-2.5 py-1 text-[11px] font-semibold text-black/60"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-5 space-y-2.5 border-t border-black/[0.07] pt-4">
                                <div className="flex items-center justify-between rounded-xl bg-[#f5f3ff] p-3">
                                    <div className="flex items-center gap-2.5">
                                        <CircleDot className="h-4 w-4 text-primarypurple" aria-hidden="true" />
                                        <span className="text-xs font-semibold sm:text-sm">
                                            Add keyboard navigation
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-primarypurple">GOOD FIRST ISSUE</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-black/[0.025] p-3">
                                    <div className="flex items-center gap-2.5">
                                        <GitFork className="h-4 w-4 text-black/50" aria-hidden="true" />
                                        <span className="text-xs font-semibold sm:text-sm">
                                            Improve route matching
                                        </span>
                                    </div>
                                    <div className="flex -space-x-2" aria-label="Two contributors">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primarypurple text-[9px] font-bold text-white">AK</span>
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primarygreen text-[9px] font-bold text-black">RM</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-black/[0.07] bg-white p-3.5">
                                <Users className="h-4 w-4 text-primarypurple" aria-hidden="true" />
                                <p className="mt-2 text-sm font-black">Skill match</p>
                                <p className="text-[11px] text-black/50">find relevant builders</p>
                            </div>
                            <div className="rounded-xl bg-black p-3.5 text-white">
                                <GitFork className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                <p className="mt-2 text-sm font-black">Open issues</p>
                                <p className="text-[11px] text-white/55">work ready to join</p>
                            </div>
                        </div>
                    </div>

                    <div className="landing-float absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-black shadow-xl sm:flex lg:-left-8">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primarygreen">
                            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                        </span>
                        Contribution accepted
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
