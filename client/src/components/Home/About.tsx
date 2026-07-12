import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const STEPS = [
    {
        number: "01",
        title: "Share the work",
        description: "List your project and describe exactly where help is useful.",
    },
    {
        number: "02",
        title: "Meet your people",
        description: "Connect with verified FASTians whose skills fit the issue.",
    },
    {
        number: "03",
        title: "Ship and give credit",
        description: "Close the issue, record the contribution, and keep building.",
    },
] as const;

const About = () => (
    <section id="about" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primarypurple px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-20"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -bottom-48 -right-24 h-96 w-96 rounded-full bg-primarygreen/25 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primarygreen">
                        Why FORKED NUCES exists
                    </p>
                    <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
                        Too many good student ideas stop at “almost done.”
                    </h2>
                    <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
                        The missing piece is often not effort—it&apos;s access to the right
                        collaborator. This platform makes that knowledge visible and turns
                        helping each other into lasting, credible experience.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-white/80">
                        <CheckCircle2 className="h-5 w-5 text-primarygreen" aria-hidden="true" />
                        Restricted to the NU community
                    </div>
                    <Link
                        href="/get-started"
                        className="group mt-9 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primarygreen px-5 font-bold text-black transition-all hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        Create your profile
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                </div>

                <ol className="divide-y divide-white/15 border-y border-white/15">
                    {STEPS.map((step) => (
                        <li key={step.number} className="grid gap-3 py-7 sm:grid-cols-[4rem_1fr] sm:gap-5">
                            <span className="font-mono text-sm font-bold text-primarygreen">
                                {step.number}
                            </span>
                            <div>
                                <h3 className="text-xl font-bold">{step.title}</h3>
                                <p className="mt-1.5 text-sm leading-6 text-white/60">
                                    {step.description}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    </section>
);

export default About;
