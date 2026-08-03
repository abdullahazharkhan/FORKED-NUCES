"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const PUBLIC_NAV_LINKS = [
    { name: "Use cases", href: "/#usecases", section: "usecases" },
    { name: "Features", href: "/#features", section: "features" },
    { name: "Why Forked", href: "/#about", section: "about" },
] as const;

const DRAWER_FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Navbar = () => {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuToggleRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (pathname !== "/") return;

        const sections = PUBLIC_NAV_LINKS.map((link) =>
            document.getElementById(link.section)
        ).filter((section): section is HTMLElement => section !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleSection = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visibleSection) setActiveSection(visibleSection.target.id);
            },
            { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.2, 0.5] }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [pathname]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const drawer = drawerRef.current;
        if (!drawer) return;
        const returnFocusTo = menuToggleRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const frame = window.requestAnimationFrame(() => {
            drawer
                .querySelector<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR)
                ?.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setIsMenuOpen(false);
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = Array.from(
                drawer.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR)
            ).filter((element) => element.getClientRects().length > 0);
            if (focusable.length === 0) {
                event.preventDefault();
                drawer.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            returnFocusTo?.focus();
        };
    }, [isMenuOpen]);

    const handleNavClick = (
        event: MouseEvent<HTMLAnchorElement>,
        href: string
    ) => {
        setIsMenuOpen(false);
        if (pathname !== "/") return;

        const id = href.split("#")[1];
        const element = id ? document.getElementById(id) : null;
        if (element) {
            event.preventDefault();
            setActiveSection(id);
            window.history.pushState(null, "", `#${id}`);
            element.scrollIntoView({ block: "start" });
        }
    };

    const solidNavigation = scrolled || pathname !== "/";

    return (
        <>
            <nav
                aria-label="Primary navigation"
                className="fixed inset-x-0 top-0 z-50 h-20 px-3 py-2 font-sans sm:px-5 lg:px-7"
            >
                <div
                    className={`mx-auto flex h-full w-full max-w-[90rem] items-center justify-between rounded-2xl border px-3 shadow-[0_12px_40px_rgba(24,10,58,0.14)] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none sm:px-5 lg:px-6 ${
                        solidNavigation
                            ? "border-white/15 bg-primarypurple/95 shadow-[0_16px_48px_rgba(24,10,58,0.24)] backdrop-blur-xl supports-[backdrop-filter]:bg-primarypurple/90"
                            : "border-white/10 bg-primarypurple/40 backdrop-blur-md supports-[backdrop-filter]:bg-primarypurple/30"
                    }`}
                >
                    <div className="flex h-full items-center gap-6">
                        <Link
                            href="/"
                            aria-label="FORKED NUCES home"
                            className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt=""
                                width={48}
                                height={48}
                                className="h-10 w-10 rounded-xl shadow-sm"
                                priority
                            />
                            <span className="text-base font-black tracking-[-0.04em] text-white sm:text-lg">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.06] p-1 lg:flex">
                            {PUBLIC_NAV_LINKS.map((link) => {
                                const isCurrent =
                                    pathname === "/" && activeSection === link.section;

                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        aria-current={isCurrent ? "location" : undefined}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,color,transform,box-shadow] duration-200 after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primarygreen after:transition-opacity after:duration-200 hover:bg-white/10 hover:text-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                                            isCurrent
                                                ? "bg-white/15 text-white shadow-sm after:opacity-100"
                                                : "text-white/80 after:opacity-0 hover:after:opacity-100"
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 lg:flex">
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/get-started"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-primarygreen px-5 text-sm font-bold text-black shadow-[0_8px_24px_rgba(190,255,0,0.2)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_28px_rgba(255,255,255,0.2)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Get started
                        </Link>
                    </div>

                    <button
                        ref={menuToggleRef}
                        type="button"
                        aria-label={
                            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                        }
                        aria-expanded={isMenuOpen}
                        aria-controls="public-mobile-drawer"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm transition-[background-color,border-color,transform] duration-200 hover:border-white/40 hover:bg-white/15 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:hidden"
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                    </button>
                </div>
            </nav>

            {isMenuOpen && (
                <>
                    <button
                        type="button"
                        className="landing-overlay-in fixed inset-0 z-40 bg-primarypurple/50 backdrop-blur-sm lg:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <aside
                        ref={drawerRef}
                        id="public-mobile-drawer"
                        className="landing-drawer-in fixed inset-y-3 right-3 z-[60] h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[390px] overflow-hidden rounded-3xl border border-white/60 bg-white font-sans shadow-[0_24px_80px_rgba(24,10,58,0.32)] lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        tabIndex={-1}
                    >
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex h-20 shrink-0 items-center justify-between border-b border-primarypurple/10 bg-white/90 px-5 backdrop-blur-lg">
                                <div>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-primarypurple/70">
                                        Navigation index
                                    </p>
                                    <p className="mt-1 text-lg font-black tracking-tight text-black">
                                        FORK&apos;D <span className="text-primarypurple">NUCES</span>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Close navigation menu"
                                    aria-controls="public-mobile-drawer"
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-primarypurple/10 bg-primarypurple/5 text-primarypurple shadow-sm transition-[background-color,transform] duration-200 hover:bg-primarypurple/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-6">
                                <nav aria-label="Mobile navigation links">
                                    <ol className="space-y-2">
                                        {PUBLIC_NAV_LINKS.map((link, index) => {
                                            const isCurrent =
                                                pathname === "/" &&
                                                activeSection === link.section;

                                            return (
                                                <li key={link.href}>
                                                    <Link
                                                        href={link.href}
                                                        aria-current={
                                                            isCurrent
                                                                ? "location"
                                                                : undefined
                                                        }
                                                        onClick={(event) =>
                                                            handleNavClick(event, link.href)
                                                        }
                                                        className={`grid min-h-14 grid-cols-[2.25rem_1fr_auto] items-center rounded-2xl border px-4 text-base font-bold tracking-tight transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple ${
                                                            isCurrent
                                                                ? "border-primarypurple/15 bg-primarypurple/10 text-primarypurple"
                                                                : "border-black/[0.06] bg-black/[0.025] text-black hover:border-primarypurple/10 hover:bg-primarypurple/[0.06] hover:text-primarypurple"
                                                        }`}
                                                    >
                                                        <span className="font-mono text-xs text-black/60">
                                                            {String(index + 1).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                        </span>
                                                        {link.name}
                                                        <span
                                                            className="text-primarypurple/60"
                                                            aria-hidden="true"
                                                        >
                                                            ↗
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </nav>

                                <div className="mt-auto grid gap-3 rounded-2xl border border-primarypurple/10 bg-primarypurple/[0.04] p-4 shadow-sm">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex h-12 items-center justify-center rounded-xl border border-primarypurple/15 bg-white px-6 text-sm font-bold text-primarypurple shadow-sm transition-[background-color,transform] duration-200 hover:bg-primarypurple/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/get-started"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex h-12 items-center justify-center rounded-xl bg-primarypurple px-6 text-sm font-bold text-white shadow-[0_10px_28px_rgba(95,45,220,0.2)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(95,45,220,0.28)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        Get started
                                    </Link>
                                    <p className="mt-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.12em] text-black/60">
                                        Verified FAST NUCES community
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
