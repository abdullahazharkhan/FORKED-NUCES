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
                className="fixed inset-x-0 top-0 z-50 px-3 pt-3 text-white sm:px-5"
            >
                <div
                    className={`mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 rounded-2xl border px-3.5 transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none sm:px-5 ${
                        scrolled
                            ? "border-white/15 bg-[#3f18a8]/92 shadow-[0_14px_38px_rgba(32,12,82,0.24)] backdrop-blur-xl"
                            : "border-white/10 bg-[linear-gradient(135deg,rgba(67,25,177,0.96),rgba(111,60,255,0.95))] shadow-[0_10px_30px_rgba(43,15,111,0.16)] backdrop-blur-lg"
                    }`}
                >
                    <div className="flex min-w-0 items-center gap-4">
                        <Link
                            href="/platform"
                            aria-label="FORKED NUCES dashboard"
                            className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <Image
                                src="/logos/forkednuces-logo-bw-invert.png"
                                alt=""
                                width={44}
                                height={44}
                                className="h-9 w-9 rounded-xl border border-white/15 shadow-[0_5px_14px_rgba(19,5,58,0.18)]"
                            />
                            <span className="hidden text-lg font-black tracking-[-0.045em] sm:inline">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                            <span className="hidden border-l border-white/20 pl-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/90 lg:inline">
                                Campus build index
                            </span>
                        </Link>

                        <div className="hidden h-16 items-stretch xl:flex">
                            {NAV_LINKS.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative my-2.5 flex items-center rounded-xl px-3 font-mono text-[0.67rem] font-semibold uppercase tracking-[0.06em] transition-[background-color,color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                                            active
                                                ? "bg-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                                                : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                    >
                                        {link.name}
                                        {active && (
                                            <span className="ml-2 h-1.5 w-1.5 rounded-full bg-primarygreen shadow-[0_0_0_3px_rgba(183,255,0,0.12)]" aria-hidden="true" />
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
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:hidden"
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
                                className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-1 pr-2 transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_8px_20px_rgba(21,5,68,0.15)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/15">
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
                                <div id="profile-menu" className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border border-black/[0.07] bg-white/95 p-2.5 text-black shadow-[0_22px_55px_rgba(31,12,78,0.2)] backdrop-blur-xl">
                                    <div className="rounded-xl bg-primarypurple/[0.045] px-3 py-3">
                                        <p className="truncate text-sm font-bold">{user?.full_name || "Your account"}</p>
                                        <p className="mt-1 truncate font-mono text-[0.66rem] text-black/60">{user?.nu_email}</p>
                                    </div>
                                    <Link onClick={() => setIsProfileOpen(false)} href="/profile" className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-primarypurple">
                                        <User className="h-4 w-4" aria-hidden="true" /> Profile
                                    </Link>
                                    <Link href="/profile/reports" onClick={() => setIsProfileOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-primarypurple">
                                        <ClipboardList className="h-4 w-4" aria-hidden="true" /> My reports
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logoutMutation.reset();
                                            logoutMutation.mutate();
                                        }}
                                        disabled={logoutMutation.isPending}
                                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-60"
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
                    <button type="button" className="landing-overlay-in fixed inset-0 z-40 bg-[#160a36]/60 backdrop-blur-md xl:hidden" aria-label="Close navigation menu" onClick={() => setIsMenuOpen(false)} />
                    <aside ref={mobileDrawerRef} id="platform-mobile-drawer" className="landing-drawer-in fixed bottom-3 right-3 top-3 z-50 w-[86vw] max-w-[360px] overflow-y-auto overscroll-contain rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,#ffffff_0%,#f7f4fd_100%)] shadow-[0_28px_80px_rgba(30,10,75,0.34)] xl:hidden" role="dialog" aria-modal="true" aria-label="Platform navigation" tabIndex={-1}>
                        <div className="flex h-20 items-center justify-between px-5">
                            <span className="text-lg font-black tracking-[-0.04em]">FORK&apos;D <span className="text-primarypurple">NUCES</span></span>
                            <button type="button" aria-label="Close navigation menu" className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] bg-white shadow-sm transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-primarypurple/30 hover:text-primarypurple" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <nav className="space-y-1 px-5 py-3" aria-label="Mobile platform navigation">
                            {NAV_LINKS.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative flex min-h-12 items-center justify-between rounded-xl px-3.5 py-3 text-base font-bold transition-[background-color,color,box-shadow] focus-visible:outline-2 focus-visible:outline-primarypurple ${
                                            active
                                                ? "bg-primarypurple text-white shadow-[0_9px_22px_rgba(111,60,255,0.2)]"
                                                : "text-black/65 hover:bg-primarypurple/[0.05] hover:text-primarypurple"
                                        }`}
                                    >
                                        {link.name}
                                        {active && <span className="h-2 w-2 rounded-full bg-primarygreen shadow-[0_0_0_4px_rgba(183,255,0,0.16)]" aria-hidden="true" />}
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
