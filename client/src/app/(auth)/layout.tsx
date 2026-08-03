import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Welcome",
    description: "Join the verified collaboration community for FAST NUCES students.",
};

const COMMUNITY_BENEFITS = [
    ["01", "Verified NU identity"],
    ["02", "Project-led collaboration"],
    ["03", "Contribution-backed profiles"],
] as const;

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-svh bg-[radial-gradient(circle_at_90%_8%,rgba(195,255,0,0.10),transparent_24rem),radial-gradient(circle_at_58%_100%,rgba(111,67,254,0.08),transparent_28rem),#f7f6fb] font-[family-name:var(--font-geist-sans)] lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]">
            <a
                href="#auth-main"
                className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-primarygreen"
            >
                Skip to authentication content
            </a>

            <main
                id="auth-main"
                tabIndex={-1}
                className="min-w-0 px-5 pb-12 pt-5 outline-none sm:px-8 sm:pb-16 sm:pt-7 lg:col-start-2 lg:row-start-1 lg:flex lg:min-h-svh lg:items-center lg:px-12 lg:py-14 xl:px-20"
            >
                <div className="mx-auto w-full max-w-[46rem]">
                    <div className="mb-12 flex items-center justify-between gap-5 lg:hidden">
                        <Link
                            href="/"
                            aria-label="FORKED NUCES home"
                            className="inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt="FORKED NUCES logo"
                                width={40}
                                height={40}
                                className="h-9 w-9 rounded-xl bg-primarypurple shadow-sm"
                            />
                            <span className="font-[family-name:var(--font-jaro)] text-xl tracking-[-0.02em] text-black">
                                FORK&apos;D <span className="text-primarypurple">NUCES</span>
                            </span>
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 transition-colors hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primarypurple"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            Home
                        </Link>
                    </div>
                    {children}
                </div>
            </main>

            <aside className="relative isolate m-3 hidden overflow-hidden rounded-3xl border border-white/15 bg-primarypurple px-7 py-7 text-white shadow-[0_24px_70px_rgba(45,20,115,0.24)] lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[calc(100svh-1.5rem)] lg:flex-col xl:px-9 xl:py-9">
                <div
                    className="landing-grid pointer-events-none absolute inset-0 opacity-20"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-10 -right-5 font-[family-name:var(--font-jaro)] text-[11rem] leading-none tracking-[-0.08em] text-white/[0.045]"
                    aria-hidden="true"
                >
                    F/N
                </div>

                <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
                    <Link
                        href="/"
                        aria-label="FORKED NUCES home"
                        className="inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt="FORKED NUCES logo"
                            width={42}
                            height={42}
                            className="h-10 w-10 rounded-xl shadow-sm"
                        />
                        <span className="font-[family-name:var(--font-jaro)] text-xl tracking-[-0.02em]">
                            FORK&apos;D <span className="text-primarygreen">NUCES</span>
                        </span>
                    </Link>
                    <span className="h-2.5 w-2.5 rounded-full bg-primarygreen shadow-[0_0_0_5px_rgba(195,255,0,0.12)]" aria-hidden="true" />
                </div>

                <div className="relative my-auto py-12">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-primarygreen">
                        Credential desk / 24
                    </p>
                    <h2 className="mt-5 text-[2.65rem] font-semibold leading-[0.93] tracking-[-0.06em] text-balance xl:text-[3.15rem]">
                        Your work starts with a verified seat.
                    </h2>
                    <p className="mt-6 text-sm leading-6 text-white/90">
                        One NU account connects your projects, collaborators, and visible
                        contribution history.
                    </p>

                    <ul className="mt-9 grid gap-2 text-sm">
                        {COMMUNITY_BENEFITS.map(([number, benefit]) => (
                            <li
                                key={benefit}
                                className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3.5 text-white/90 backdrop-blur-sm"
                            >
                                <span className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold text-primarygreen">
                                    {number}
                                </span>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[0.625rem] uppercase tracking-[0.16em] text-white/90">
                        FAST NUCES access only
                    </p>
                    <Link
                        href="/"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primarygreen focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        Back to the public site
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            </aside>
        </div>
    );
}
