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
    <footer className="relative rounded-t-[2rem] border-t border-white/15 bg-primarypurple px-5 pb-6 pt-8 font-sans text-white shadow-[0_-20px_70px_rgba(66,30,150,0.16)] sm:rounded-t-[2.5rem] sm:px-8 sm:pb-8 sm:pt-10 lg:px-12 lg:pt-12">
        <div className="mx-auto max-w-[90rem]">
            <div className="grid gap-8 rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-6 shadow-[0_18px_55px_rgba(20,8,48,0.14)] backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
                <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primarygreen">
                        Open build / next entry
                    </p>
                    <h2 className="mt-5 max-w-4xl text-balance text-4xl font-black leading-[0.94] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                        Bring the project.
                        <br />
                        Find the missing piece.
                    </h2>
                </div>
                <Link
                    href="/get-started"
                    className={`group inline-flex min-h-14 items-center justify-between gap-8 rounded-2xl bg-primarygreen px-6 text-sm font-bold text-black shadow-[0_12px_32px_rgba(190,255,0,0.18)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_36px_rgba(255,255,255,0.18)] active:translate-y-px lg:min-w-64 ${linkFocus}`}
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

            <div className="mt-6 grid gap-12 rounded-[1.75rem] border border-white/10 bg-black/10 p-6 shadow-[0_16px_48px_rgba(20,8,48,0.1)] sm:p-8 md:grid-cols-[1.1fr_0.9fr] lg:p-10">
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
                            className="h-11 w-11 rounded-xl shadow-sm"
                        />
                        <span className="text-xl font-black tracking-[-0.045em]">
                            FORK&apos;D <span className="text-primarygreen">NUCES</span>
                        </span>
                    </Link>
                    <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
                        A verified collaboration space where FASTians share projects,
                        solve real issues, and build better together.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold">
                        <Link
                            href="https://github.com/abdullahazharkhan/FORKED-NUCES"
                            target="_blank"
                            rel="noreferrer"
                            className={`group inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-white/80 shadow-sm transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-primarygreen/25 hover:bg-white/10 hover:text-primarygreen active:translate-y-px ${linkFocus}`}
                        >
                            Source on GitHub <span aria-hidden="true">↗</span>
                        </Link>
                        <Link
                            href="mailto:k230691@nu.edu.pk"
                            className={`inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-white/80 shadow-sm transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-primarygreen/25 hover:bg-white/10 hover:text-primarygreen active:translate-y-px ${linkFocus}`}
                        >
                            Email the team <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:justify-self-end">
                    <nav
                        aria-label="Footer navigation"
                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:min-w-48"
                    >
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                            Explore
                        </p>
                        <ul className="mt-5 space-y-3">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`inline-flex min-h-11 items-center rounded-lg px-2 py-1 text-sm text-white/80 transition-[background-color,color] duration-200 hover:bg-white/[0.07] hover:text-white active:text-primarygreen ${linkFocus}`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav
                        aria-label="Community documents"
                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:min-w-48"
                    >
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                            Field manual
                        </p>
                        <ul className="mt-5 space-y-3">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`inline-flex min-h-11 items-center rounded-lg px-2 py-1 text-sm text-white/80 transition-[background-color,color] duration-200 hover:bg-white/[0.07] hover:text-white active:text-primarygreen ${linkFocus}`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/community-guidelines"
                                    className={`inline-flex min-h-11 items-center rounded-lg px-2 py-1 text-sm text-white/80 transition-[background-color,color] duration-200 hover:bg-white/[0.07] hover:text-white active:text-primarygreen ${linkFocus}`}
                                >
                                    Community guidelines
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/10 px-5 py-4 text-xs text-white/70 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 FORKED NUCES. Built by FASTians, for FASTians.</p>
                <p className="font-mono uppercase tracking-[0.12em]">
                    Build · connect · grow
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
