import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, Mail } from "lucide-react";

const FOOTER_LINKS = [
    { label: "Use cases", href: "/#usecases" },
    { label: "Features", href: "/#features" },
    { label: "Why Forked", href: "/#about" },
    { label: "Community guidelines", href: "/community-guidelines" },
] as const;

const LEGAL_LINKS = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
] as const;

const Footer = () => (
    <footer className="bg-[#0d0b12] px-5 pb-8 pt-16 text-white sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div className="max-w-md">
                    <Link href="/" className="inline-flex items-center gap-3 rounded-lg">
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt=""
                            width={48}
                            height={48}
                            className="h-11 w-11 rounded-xl"
                        />
                        <span className="text-xl font-black tracking-[-0.04em]">
                            FORK&apos;D <span className="text-primarygreen">NUCES</span>
                        </span>
                    </Link>
                    <p className="mt-5 text-sm leading-6 text-white/50">
                        A verified collaboration space where FASTians share projects,
                        solve real issues, and build better together.
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        <Link
                            href="https://github.com/abdullahazharkhan/FORKED-NUCES"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="View FORKED NUCES on GitHub"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-primarygreen hover:text-primarygreen"
                        >
                            <Github className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="mailto:k230691@nu.edu.pk"
                            aria-label="Email the FORKED NUCES team"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-primarygreen hover:text-primarygreen"
                        >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                <nav aria-label="Footer navigation">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                        Explore
                    </p>
                    <ul className="mt-5 space-y-3">
                        {FOOTER_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                        Ready to build?
                    </p>
                    <p className="mt-5 text-sm leading-6 text-white/60">
                        Bring the project. Find the missing piece.
                    </p>
                    <Link
                        href="/get-started"
                        className="group mt-5 inline-flex items-center gap-2 text-sm font-bold text-primarygreen"
                    >
                        Join the community
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 FORKED NUCES. FASTians build better together.</p>
                <nav aria-label="Legal" className="flex gap-5">
                    {LEGAL_LINKS.map((link) => (
                        <Link key={link.href} href={link.href} className="hover:text-white">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    </footer>
);

export default Footer;
