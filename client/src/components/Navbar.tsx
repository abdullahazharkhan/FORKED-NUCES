"use client";

import {
    type MouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const PUBLIC_NAV_LINKS = [
    { name: "Use Cases", href: "/#usecases" },
    { name: "Features", href: "/#features" },
    { name: "About", href: "/#about" },
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
                drawer.querySelectorAll<HTMLElement>(
                    DRAWER_FOCUSABLE_SELECTOR
                )
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
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const solidNavigation = scrolled || pathname !== "/";

    return (
        <>
            <nav
                className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 font-poppins transition-all duration-300 ${
                    solidNavigation
                        ? "bg-primarypurple/90 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-primarypurple/90"
                        : "bg-transparent"
                }`}
            >
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-4">
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt="FORKED NUCES home"
                            width={200}
                            height={200}
                            className="h-14 w-14 rounded-xl"
                        />
                        <span className="text-2xl font-bold text-white md:hidden">
                            FORKED NUCES
                        </span>
                    </Link>

                    <div className="hidden gap-8 md:flex">
                        {PUBLIC_NAV_LINKS.map((link) => (
                            <Link
                                href={link.href}
                                key={link.href}
                                onClick={(event) =>
                                    handleNavClick(event, link.href)
                                }
                                className="text-lg font-bold text-white transition-colors hover:text-white/80 md:text-xl lg:text-2xl"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    <Link
                        href="/login"
                        className="flex h-14 items-center justify-center rounded-xl bg-black px-8 text-lg font-bold text-white transition-all hover:bg-black/80 md:text-xl lg:text-2xl"
                    >
                        Login
                    </Link>
                    <Link
                        href="/get-started"
                        className="flex h-14 items-center justify-center rounded-xl bg-black px-8 text-lg font-bold text-white transition-all hover:bg-black/80 md:text-xl lg:text-2xl"
                    >
                        Get Started
                    </Link>
                </div>

                <button
                    ref={menuToggleRef}
                    type="button"
                    aria-label={
                        isMenuOpen
                            ? "Close navigation menu"
                            : "Open navigation menu"
                    }
                    aria-expanded={isMenuOpen}
                    aria-controls="public-mobile-drawer"
                    className="flex h-14 cursor-pointer place-items-center md:hidden"
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <Menu
                        strokeWidth={4}
                        className="text-white"
                        size={35}
                        aria-hidden="true"
                    />
                </button>
            </nav>

            {isMenuOpen && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    <aside
                        ref={drawerRef}
                        id="public-mobile-drawer"
                        className="fixed right-0 top-0 z-50 h-screen w-[80vw] max-w-[360px] border-l border-white/30 bg-white/90 shadow-2xl backdrop-blur-xl md:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        tabIndex={-1}
                    >
                        <div className="mt-3 flex h-16 items-center justify-between px-5">
                            <span className="text-2xl font-bold tracking-tighter">
                                Menu
                            </span>
                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                aria-controls="public-mobile-drawer"
                                className="flex h-14 cursor-pointer place-items-center md:hidden"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X
                                    strokeWidth={4}
                                    className="text-black"
                                    size={35}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            <nav
                                className="flex flex-col gap-4"
                                aria-label="Mobile navigation links"
                            >
                                {PUBLIC_NAV_LINKS.map((link) => (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        onClick={(event) =>
                                            handleNavClick(event, link.href)
                                        }
                                        className="text-lg font-bold tracking-tighter text-black transition-colors hover:text-black/80 md:text-xl lg:text-2xl"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-6 h-px bg-black" />

                            <div className="mt-6 flex flex-col gap-3">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-14 items-center justify-center rounded-xl bg-black px-8 text-lg font-bold text-white transition-all hover:bg-black/80 md:text-xl lg:text-2xl"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/get-started"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-14 items-center justify-center rounded-xl bg-black px-8 text-lg font-bold text-white transition-all hover:bg-black/80 md:text-xl lg:text-2xl"
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
