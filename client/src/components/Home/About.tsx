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
        className="scroll-mt-20 bg-[#F7F6FB] px-5 pb-20 font-sans text-white sm:px-8 sm:pb-24 lg:pb-28"
    >
        <div className="relative isolate mx-auto max-w-[90rem] overflow-hidden rounded-[2rem] bg-primarypurple px-6 py-9 shadow-[0_28px_80px_rgba(62,34,139,0.22)] sm:rounded-[2.5rem] sm:px-10 sm:py-12 lg:px-14 lg:py-16 xl:px-16">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-15"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-primarygreen/15 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -bottom-48 left-1/4 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative flex flex-col gap-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/80 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-xs">
                <p className="flex items-center gap-2.5">
                    <span
                        className="h-2 w-2 rounded-full bg-primarygreen shadow-[0_0_0_5px_rgba(195,255,0,0.12)]"
                        aria-hidden="true"
                    />
                    Why FORKED NUCES exists
                </p>
                <p className="font-mono tabular-nums text-primarygreen">
                    Build protocol / 03 stages
                </p>
            </div>

            <div className="relative grid gap-12 pt-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-14 lg:pt-14 xl:gap-20">
                <header className="max-w-2xl">
                    <h2 className="text-balance text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[3.5rem]">
                        Too many good student ideas stop at “almost done.”
                    </h2>
                    <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                        The missing piece is often not effort—it&apos;s access to the right
                        collaborator. This platform makes that knowledge visible and turns
                        helping each other into lasting, credible experience.
                    </p>

                    <div className="mt-8 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm">
                        <span
                            className="h-2.5 w-2.5 rounded-full bg-primarygreen shadow-[0_0_0_4px_rgba(195,255,0,0.12)]"
                            aria-hidden="true"
                        />
                        Restricted to the NU community
                    </div>

                    <Link
                        href="/get-started"
                        className="group mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-primarygreen px-6 text-sm font-bold text-black shadow-[0_12px_30px_rgba(31,20,70,0.2)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_36px_rgba(31,20,70,0.28)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        Create your profile
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </header>

                <ol className="grid gap-4">
                    {STEPS.map((step) => (
                        <li
                            key={step.number}
                            className="group grid gap-4 rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-[0_12px_35px_rgba(31,20,70,0.1)] backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.13] sm:grid-cols-[3rem_minmax(0,1fr)_8rem] sm:items-start sm:gap-5 sm:p-6"
                        >
                            <div className="flex items-center justify-between sm:block">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primarygreen font-mono text-xs font-black text-black shadow-[0_8px_20px_rgba(31,20,70,0.15)]">
                                    {step.number}
                                </span>
                                <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-primarygreen sm:hidden">
                                    {step.state}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">
                                    {step.title}
                                </h3>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                                    {step.description}
                                </p>
                            </div>
                            <p className="hidden font-mono text-[0.65rem] font-bold uppercase tracking-[0.13em] text-primarygreen sm:block sm:pt-1 sm:text-right">
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
