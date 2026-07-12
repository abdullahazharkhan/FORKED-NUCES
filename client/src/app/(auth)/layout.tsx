import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, GitFork, UsersRound } from "lucide-react";

export const metadata: Metadata = {
    title: "Welcome",
    description: "Join the verified collaboration community for FAST NUCES students.",
};

const COMMUNITY_BENEFITS = [
    "Share projects and open issues",
    "Find contributors across batches",
    "Build a contribution-backed profile",
] as const;

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-svh bg-[#f4f3f8] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)]">
            <aside className="relative isolate overflow-hidden bg-primarypurple px-5 pb-10 pt-6 text-white sm:px-8 lg:flex lg:min-h-svh lg:flex-col lg:px-12 lg:py-10 xl:px-16">
                <div
                    className="landing-grid pointer-events-none absolute inset-0 opacity-25"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-primarygreen/20 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl"
                    aria-hidden="true"
                />

                <div className="relative mx-auto flex w-full max-w-2xl items-center justify-between lg:mx-0">
                    <Link
                        href="/"
                        aria-label="FORKED NUCES home"
                        className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt=""
                            width={48}
                            height={48}
                            className="h-11 w-11 rounded-xl"
                        />
                        <span className="text-lg font-black tracking-[-0.04em] sm:text-xl">
                            FORK&apos;D <span className="text-primarygreen">NUCES</span>
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/75 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Back home</span>
                    </Link>
                </div>

                <div className="relative mx-auto mt-12 w-full max-w-2xl lg:mx-0 lg:my-auto lg:py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primarygreen">
                        FASTians build better together
                    </p>
                    <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl xl:text-6xl">
                        Turn the missing piece into your next collaboration.
                    </h2>
                    <p className="mt-5 max-w-xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                        Bring your project, your curiosity, or your strongest skill. The
                        community helps you find where all three can create momentum.
                    </p>

                    <ul className="mt-7 hidden space-y-3 text-sm text-white/75 sm:block">
                        {COMMUNITY_BENEFITS.map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primarygreen text-black">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                                </span>
                                {benefit}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 hidden max-w-lg rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:block">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarygreen text-black">
                                    <GitFork className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">Open work. Shared credit.</p>
                                    <p className="mt-0.5 text-xs text-white/50">Collaboration made visible.</p>
                                </div>
                            </div>
                            <UsersRound className="h-5 w-5 text-primarygreen" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex min-h-[calc(100svh-15rem)] items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:min-h-svh lg:px-10 xl:px-16">
                <div className="w-full max-w-[34rem]">{children}</div>
            </main>
        </div>
    );
}
