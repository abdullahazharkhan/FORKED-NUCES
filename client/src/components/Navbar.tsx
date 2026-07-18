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
                className={`fixed inset-x-0 top-0 z-50 h-20 border-b font-sans transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none ${
                    solidNavigation
                        ? "border-white/20 bg-primarypurple/95 backdrop-blur-lg supports-[backdrop-filter]:bg-primarypurple/90"
                        : "border-white/15 bg-transparent"
                }`}
            >
                <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <div className="flex h-full items-center gap-10">
                        <Link
                            href="/"
                            aria-label="FORKED NUCES home"
                            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt=""
                                width={48}
                                height={48}
                                className="h-10 w-10"
                                priority
                            />
                            <span className="text-base font-black tracking-[-0.04em] text-white sm:text-lg">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                        </Link>

                        <div className="hidden h-full items-center gap-8 lg:flex">
                            {PUBLIC_NAV_LINKS.map((link) => {
                                const isCurrent =
                                    pathname === "/" && activeSection === link.section;

                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        aria-current={isCurrent ? "location" : undefined}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative flex h-full items-center text-sm font-semibold transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-primarygreen after:transition-transform after:duration-200 hover:text-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                                            isCurrent
                                                ? "text-white after:scale-x-100"
                                                : "text-white/90 after:scale-x-0 hover:after:scale-x-100"
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
                            className="inline-flex h-11 items-center justify-center border border-white/30 px-5 text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:border-white/70 hover:bg-white/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/get-started"
                            className="inline-flex h-11 items-center justify-center bg-primarygreen px-5 text-sm font-bold text-black transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
                        className="flex h-11 w-11 items-center justify-center border border-white/30 bg-white/5 text-white transition-[background-color,transform] duration-200 hover:bg-white/15 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:hidden"
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
                        className="landing-overlay-in fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <aside
                        ref={drawerRef}
                        id="public-mobile-drawer"
                        className="landing-drawer-in fixed right-0 top-0 z-[60] h-dvh w-[88vw] max-w-[390px] border-l border-black bg-white font-sans lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        tabIndex={-1}
                    >
                        <div className="flex h-20 items-center justify-between border-b border-black px-5">
                            <div>
                                <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-primarypurple">
                                    Navigation index
                                </p>
                                <p className="mt-1 text-lg font-black tracking-tight">
                                    FORK&apos;D NUCES
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                aria-controls="public-mobile-drawer"
                                className="flex h-10 w-10 items-center justify-center border border-black/20 text-black transition-[background-color,transform] duration-200 hover:bg-black/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex h-[calc(100dvh-5rem)] flex-col px-5 py-7">
                            <nav aria-label="Mobile navigation links">
                                <ol className="border-t border-black/20">
                                    {PUBLIC_NAV_LINKS.map((link, index) => {
                                        const isCurrent =
                                            pathname === "/" &&
                                            activeSection === link.section;

                                        return (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    aria-current={
                                                        isCurrent ? "location" : undefined
                                                    }
                                                    onClick={(event) =>
                                                        handleNavClick(event, link.href)
                                                    }
                                                    className={`grid min-h-16 grid-cols-[2.25rem_1fr_auto] items-center border-b border-black/20 text-lg font-bold tracking-tight transition-colors duration-200 active:bg-primarygreen/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple ${
                                                        isCurrent
                                                            ? "text-primarypurple"
                                                            : "text-black hover:text-primarypurple"
                                                    }`}
                                                >
                                                    <span className="font-mono text-xs text-black/60">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                    {link.name}
                                                    <span aria-hidden="true">↗</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>

                            <div className="mt-auto grid gap-3 border-t border-black/20 pt-6">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-12 items-center justify-center border border-black/25 bg-white px-6 text-sm font-bold text-black transition-[background-color,transform] duration-200 hover:bg-black/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/get-started"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-12 items-center justify-center bg-primarypurple px-6 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-black active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                >
                                    Get started
                                </Link>
                                <p className="mt-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.12em] text-black/60">
                                    Verified FAST NUCES community
                                </p>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
