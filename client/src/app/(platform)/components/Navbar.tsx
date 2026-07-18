"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    ClipboardList,
    LogOut,
    Menu,
    User,
    X,
} from "lucide-react";

import { authFetch } from "@/lib/authFetch";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import { useAuthStore } from "@/stores";
import { NotificationBell } from "./NotificationBell";

const NAV_LINKS = [
    { name: "Explore", href: "/platform" },
    { name: "Recommended", href: "/platform/recommended" },
    { name: "People", href: "/platform/users" },
    { name: "Collaborations", href: "/collaborations" },
    { name: "Activity", href: "/activity" },
    { name: "Leaderboard", href: "/leaderboard" },
] as const;

const DRAWER_FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const clearUser = useAuthStore((state) => state.clearUser);
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const profileButtonRef = useRef<HTMLButtonElement>(null);
    const mobileToggleRef = useRef<HTMLButtonElement>(null);
    const mobileDrawerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isProfileOpen) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setIsProfileOpen(false);
            profileButtonRef.current?.focus();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isProfileOpen]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const drawer = mobileDrawerRef.current;
        if (!drawer) return;
        const returnFocusTo = mobileToggleRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const frame = requestAnimationFrame(() => {
            drawer.querySelector<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR)?.focus();
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
            if (focusable.length === 0) return;
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
            cancelAnimationFrame(frame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            returnFocusTo?.focus();
        };
    }, [isMenuOpen]);

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const response = await authFetch("/api/auth/logout/", { method: "POST" });
            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail ?? "Unable to complete logout. Please try again.");
            }
        },
        onSuccess: () => {
            setIsProfileOpen(false);
            setIsMenuOpen(false);
            queryClient.clear();
            clearUser();
            router.replace("/login");
        },
    });

    const isActive = (href: string) =>
        href === "/platform"
            ? pathname === href || pathname.startsWith("/platform/projects/")
            : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <>
            <nav
                aria-label="Primary navigation"
                className={`fixed inset-x-0 top-0 z-50 h-20 border-b bg-primarypurple text-white transition-[border-color,background-color] duration-300 motion-reduce:transition-none ${
                    scrolled
                        ? "border-white/20 bg-primarypurple/95 backdrop-blur-md"
                        : "border-transparent"
                }`}
            >
                <div className="mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between gap-4 px-5 sm:px-8">
                    <div className="flex min-w-0 items-center gap-7">
                        <Link
                            href="/platform"
                            aria-label="FORKED NUCES dashboard"
                            className="flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt=""
                                width={44}
                                height={44}
                                className="h-9 w-9 rounded-sm border border-white/20"
                            />
                            <span className="hidden text-lg font-black tracking-[-0.045em] sm:inline">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                            <span className="hidden border-l border-white/20 pl-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/90 lg:inline">
                                Campus build index
                            </span>
                        </Link>

                        <div className="hidden h-20 items-stretch xl:flex">
                            {NAV_LINKS.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative flex items-center px-2.5 font-mono text-[0.67rem] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-white ${
                                            active
                                                ? "text-white"
                                                : "text-white/90 hover:text-white"
                                        }`}
                                    >
                                        {link.name}
                                        {active && (
                                            <span className="absolute inset-x-2.5 bottom-0 h-1 bg-primarygreen" aria-hidden="true" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            ref={mobileToggleRef}
                            type="button"
                            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={isMenuOpen}
                            aria-controls="platform-mobile-drawer"
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-white/10 transition hover:bg-white/20 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:hidden"
                            onClick={() => setIsMenuOpen((open) => !open)}
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <NotificationBell />

                        <div className="relative" ref={profileRef}>
                            <button
                                ref={profileButtonRef}
                                type="button"
                                onClick={() => setIsProfileOpen((open) => !open)}
                                aria-label={isProfileOpen ? "Close account menu" : "Open account menu"}
                                aria-expanded={isProfileOpen}
                                aria-controls="profile-menu"
                                className="flex h-11 items-center gap-2 rounded-md border border-white/25 bg-white/10 p-1 pr-2 transition-colors hover:bg-white/20 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm border border-white/15 bg-white/15">
                                    {user?.avatar_url ? (
                                        <Image loader={passthroughImageLoader} unoptimized src={user.avatar_url} alt="" width={32} height={32} className="h-8 w-8 object-cover" />
                                    ) : (
                                        <User className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </span>
                                <span className="hidden max-w-24 truncate text-sm font-semibold sm:block">
                                    {user?.full_name?.split(" ")[0] || "Account"}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                            </button>

                            {isProfileOpen && (
                                <div id="profile-menu" className="absolute right-0 top-full mt-2 w-60 rounded-md border border-black/15 bg-white p-2 text-black shadow-[4px_4px_0_rgba(23,19,31,0.14)]">
                                    <div className="border-b border-black/10 px-3 py-2.5">
                                        <p className="truncate text-sm font-bold">{user?.full_name || "Your account"}</p>
                                        <p className="mt-1 truncate font-mono text-[0.66rem] text-black/60">{user?.nu_email}</p>
                                    </div>
                                    <Link onClick={() => setIsProfileOpen(false)} href="/profile" className="mt-1 flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-black/65 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-primarypurple">
                                        <User className="h-4 w-4" aria-hidden="true" /> Profile
                                    </Link>
                                    <Link href="/profile/reports" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-black/65 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-primarypurple">
                                        <ClipboardList className="h-4 w-4" aria-hidden="true" /> My reports
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logoutMutation.reset();
                                            logoutMutation.mutate();
                                        }}
                                        disabled={logoutMutation.isPending}
                                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-60"
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        {logoutMutation.isPending ? "Logging out..." : "Log out"}
                                    </button>
                                    {logoutMutation.isError && (
                                        <p className="px-3 py-2 text-xs text-red-700" role="alert">{logoutMutation.error.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {isMenuOpen && (
                <>
                    <button type="button" className="landing-overlay-in fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden" aria-label="Close navigation menu" onClick={() => setIsMenuOpen(false)} />
                    <aside ref={mobileDrawerRef} id="platform-mobile-drawer" className="landing-drawer-in fixed right-0 top-0 z-50 h-dvh w-[86vw] max-w-[360px] border-l border-primarypurple/30 bg-white xl:hidden" role="dialog" aria-modal="true" aria-label="Platform navigation" tabIndex={-1}>
                        <div className="flex h-20 items-center justify-between border-b border-black/10 px-5">
                            <span className="text-lg font-black tracking-[-0.04em]">FORK&apos;D <span className="text-primarypurple">NUCES</span></span>
                            <button type="button" aria-label="Close navigation menu" className="flex h-10 w-10 items-center justify-center rounded-md border border-black/15 bg-black/[0.03] transition hover:border-primarypurple hover:text-primarypurple active:translate-y-px" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <nav className="px-5 py-6" aria-label="Mobile platform navigation">
                            {NAV_LINKS.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative flex items-center justify-between border-b border-black/10 px-3 py-3.5 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primarypurple ${
                                            active
                                                ? "border-l-2 border-l-primarypurple bg-primarypurple/[0.06] text-primarypurple"
                                                : "text-black/65 hover:bg-primarypurple/[0.04] hover:text-primarypurple"
                                        }`}
                                    >
                                        {link.name}
                                        {active && <span className="h-2 w-2 bg-primarygreen ring-1 ring-black/20" aria-hidden="true" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
