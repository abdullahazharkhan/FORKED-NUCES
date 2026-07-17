"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const PUBLIC_NAV_LINKS = [
    { name: "Use Cases", href: "/#usecases" },
    { name: "Features", href: "/#features" },
    { name: "Why Forked", href: "/#about" },
] as const;

const DRAWER_FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Navbar = () => {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
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
            window.history.pushState(null, "", `#${id}`);
            element.scrollIntoView({ block: "start" });
        }
    };

    const solidNavigation = scrolled || pathname !== "/";

    return (
        <>
            <nav
                aria-label="Primary navigation"
                className="fixed inset-x-0 top-0 z-50 h-20 font-poppins"
            >
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                    <div
                        className={`h-20 transition-[width,transform,border-radius,background-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none ${
                            scrolled
                                ? "w-[calc(100%-1.5rem)] max-w-7xl translate-y-3 rounded-2xl bg-primarypurple/90 shadow-[0_12px_40px_rgba(22,9,60,0.24)] backdrop-blur-xl supports-[backdrop-filter]:bg-primarypurple/85 sm:w-[calc(100%-2.5rem)]"
                                : solidNavigation
                                  ? "w-full rounded-none bg-primarypurple/90 shadow-[0_8px_30px_rgba(22,9,60,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-primarypurple/85"
                                  : "w-full rounded-none bg-transparent"
                        }`}
                    />
                </div>

                <div
                    className={`relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 transition-transform duration-300 ease-out motion-reduce:transition-none sm:px-8 ${
                        scrolled ? "translate-y-3" : "translate-y-0"
                    }`}
                >
                    <div className="flex items-center gap-9">
                        <Link
                            href="/"
                            aria-label="FORKED NUCES home"
                            className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt=""
                                width={48}
                                height={48}
                                className="h-11 w-11 rounded-xl"
                            />
                            <span className="text-lg font-black tracking-[-0.04em] text-white sm:text-xl">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-7 lg:flex">
                            {PUBLIC_NAV_LINKS.map((link) => (
                                <Link
                                    href={link.href}
                                    key={link.href}
                                    onClick={(event) => handleNavClick(event, link.href)}
                                    className="rounded-md text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 lg:flex">
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Login
                        </Link>
                        <Link
                            href="/get-started"
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-primarygreen px-5 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Get Started
                        </Link>
                    </div>

                    <button
                        ref={menuToggleRef}
                        type="button"
                        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isMenuOpen}
                        aria-controls="public-mobile-drawer"
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 lg:hidden"
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <Menu className="h-6 w-6 text-white" strokeWidth={2.5} aria-hidden="true" />
                    </button>
                </div>
            </nav>

            {isMenuOpen && (
                <>
                    <button
                        type="button"
                        className="landing-overlay-in fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <aside
                        ref={drawerRef}
                        id="public-mobile-drawer"
                        className="landing-drawer-in fixed right-0 top-0 z-50 h-dvh w-[84vw] max-w-[380px] border-l border-black/10 bg-white shadow-2xl lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        tabIndex={-1}
                    >
                        <div className="flex h-20 items-center justify-between border-b border-black/10 px-6">
                            <span className="text-xl font-black tracking-tight">
                                FORK&apos;D <span className="text-primarypurple">NUCES</span>
                            </span>
                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                aria-controls="public-mobile-drawer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.05]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X className="h-6 w-6 text-black" strokeWidth={2.5} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="px-6 py-7">
                            <nav className="flex flex-col gap-2" aria-label="Mobile navigation links">
                                {PUBLIC_NAV_LINKS.map((link) => (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className="rounded-lg px-1 py-2 text-lg font-bold tracking-tight text-black transition-colors hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-primarypurple"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-6 h-px bg-black/10" />
                            <div className="mt-6 flex flex-col gap-3">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-12 items-center justify-center rounded-xl border border-black/15 bg-white px-6 text-base font-bold text-black transition-all hover:bg-black/[0.04]"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/get-started"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-12 items-center justify-center rounded-xl bg-primarypurple px-6 text-base font-bold text-white transition-all hover:bg-primarypurple/90"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
