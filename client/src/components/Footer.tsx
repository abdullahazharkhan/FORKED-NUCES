import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
    { label: "Use cases", href: "/#usecases" },
    { label: "Features", href: "/#features" },
    { label: "Why Forked", href: "/#about" },
    { label: "Community guidelines", href: "/community-guidelines" },
] as const;

const LEGAL_LINKS = [
    { label: "Privacy notice", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
] as const;

const linkFocus =
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

const Footer = () => (
    <footer className="border-t border-white/20 bg-primarypurple px-5 pb-8 pt-16 font-sans text-white sm:px-8 sm:pt-20 lg:px-12 lg:pt-24">
        <div className="mx-auto max-w-[90rem]">
            <div className="grid gap-8 border-b border-white/25 pb-12 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-16">
                <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primarygreen">
                        Open build / next entry
                    </p>
                    <h2 className="mt-5 max-w-4xl text-balance text-5xl font-black leading-[0.88] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                        Bring the project.
                        <br />
                        Find the missing piece.
                    </h2>
                </div>
                <Link
                    href="/get-started"
                    className={`group inline-flex min-h-16 items-center justify-between gap-8 bg-primarygreen px-6 text-sm font-bold text-black transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-px lg:min-w-64 ${linkFocus}`}
                >
                    Join the community
                    <span
                        className="text-lg transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                        aria-hidden="true"
                    >
                        ↗
                    </span>
                </Link>
            </div>

            <div className="grid gap-12 border-b border-white/20 py-12 md:grid-cols-[1.1fr_0.9fr] lg:py-14">
                <div className="max-w-lg">
                    <Link
                        href="/"
                        aria-label="FORKED NUCES home"
                        className={`inline-flex items-center gap-3 ${linkFocus}`}
                    >
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt=""
                            width={48}
                            height={48}
                            className="h-11 w-11"
                        />
                        <span className="text-xl font-black tracking-[-0.045em]">
                            FORK&apos;D <span className="text-primarygreen">NUCES</span>
                        </span>
                    </Link>
                    <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
                        A verified collaboration space where FASTians share projects,
                        solve real issues, and build better together.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                        <Link
                            href="https://github.com/abdullahazharkhan/FORKED-NUCES"
                            target="_blank"
                            rel="noreferrer"
                            className={`group text-white/75 transition-colors duration-200 hover:text-primarygreen active:text-white ${linkFocus}`}
                        >
                            Source on GitHub <span aria-hidden="true">↗</span>
                        </Link>
                        <Link
                            href="mailto:k230691@nu.edu.pk"
                            className={`text-white/75 transition-colors duration-200 hover:text-primarygreen active:text-white ${linkFocus}`}
                        >
                            Email the team <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-10 sm:grid-cols-2 md:justify-self-end md:gap-16 lg:gap-24">
                    <nav aria-label="Footer navigation">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                            Explore
                        </p>
                        <ul className="mt-5 space-y-3">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm text-white/80 transition-colors duration-200 hover:text-white active:text-primarygreen ${linkFocus}`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="Community documents">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                            Field manual
                        </p>
                        <ul className="mt-5 space-y-3">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm text-white/80 transition-colors duration-200 hover:text-white active:text-primarygreen ${linkFocus}`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/community-guidelines"
                                    className={`text-sm text-white/80 transition-colors duration-200 hover:text-white active:text-primarygreen ${linkFocus}`}
                                >
                                    Community guidelines
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-7 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 FORKED NUCES. Built by FASTians, for FASTians.</p>
                <p className="font-mono uppercase tracking-[0.12em]">
                    Build · connect · grow
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
