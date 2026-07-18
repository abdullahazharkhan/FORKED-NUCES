import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
    {
        number: "01",
        title: "Share the work",
        description: "List your project and describe exactly where help is useful.",
        state: "Project indexed",
    },
    {
        number: "02",
        title: "Meet your people",
        description: "Connect with verified FASTians whose skills fit the issue.",
        state: "Match confirmed",
    },
    {
        number: "03",
        title: "Ship and give credit",
        description: "Close the issue, record the contribution, and keep building.",
        state: "Work recorded",
    },
] as const;

const About = () => (
    <section
        id="about"
        className="relative isolate scroll-mt-20 overflow-hidden bg-primarypurple px-5 py-20 font-sans text-white sm:px-8 sm:py-28 lg:py-32"
    >
        <div
            className="landing-grid pointer-events-none absolute inset-0 opacity-20"
            aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[90rem]">
            <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
                <p>Why FORKED NUCES exists</p>
                <p className="font-mono tabular-nums">Build protocol / 03 stages</p>
            </div>

            <div className="grid gap-14 pt-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:pt-14 xl:gap-28">
                <header>
                    <h2 className="max-w-2xl text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                        Too many good student ideas stop at “almost done.”
                    </h2>
                    <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                        The missing piece is often not effort—it&apos;s access to the right
                        collaborator. This platform makes that knowledge visible and turns
                        helping each other into lasting, credible experience.
                    </p>

                    <div className="mt-8 flex items-center gap-3 border-l-2 border-primarygreen pl-4 text-sm font-semibold text-white/90">
                        <span className="h-2 w-2 bg-primarygreen" aria-hidden="true" />
                        Restricted to the NU community
                    </div>

                    <Link
                        href="/get-started"
                        className="group mt-9 inline-flex min-h-14 items-center justify-center gap-3 bg-primarygreen px-6 text-sm font-bold text-black transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        Create your profile
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </header>

                <ol className="border-t border-white/25">
                    {STEPS.map((step, index) => (
                        <li
                            key={step.number}
                            className="relative grid gap-4 border-b border-white/20 py-7 sm:grid-cols-[4rem_minmax(0,1fr)_9rem] sm:gap-5 sm:py-9"
                        >
                            <div className="flex items-center gap-3 sm:block">
                                <span className="font-mono text-sm font-bold text-primarygreen">
                                    {step.number}
                                </span>
                                <span
                                    className="relative ml-auto hidden h-3 w-3 border-2 border-primarypurple bg-primarygreen ring-1 ring-primarygreen sm:mt-5 sm:block"
                                    aria-hidden="true"
                                >
                                    {index < STEPS.length - 1 && (
                                        <span className="absolute left-1/2 top-full h-24 w-px -translate-x-1/2 bg-white/20" />
                                    )}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">
                                    {step.title}
                                </h3>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-white/90">
                                    {step.description}
                                </p>
                            </div>
                            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-primarygreen sm:pt-1 sm:text-right">
                                {step.state}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    </section>
);

export default About;
