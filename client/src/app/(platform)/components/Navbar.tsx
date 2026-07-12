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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const profileButtonRef = useRef<HTMLButtonElement>(null);
    const mobileToggleRef = useRef<HTMLButtonElement>(null);
    const mobileDrawerRef = useRef<HTMLElement>(null);

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
            <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primarypurple/90 text-white shadow-[0_8px_30px_rgba(22,9,60,0.16)] backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
                    <div className="flex min-w-0 items-center gap-8">
                        <Link href="/platform" aria-label="FORKED NUCES dashboard" className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                            <Image src="/logos/forkednuces-logo-bw-invert.png" alt="" width={44} height={44} className="h-10 w-10 rounded-xl" />
                            <span className="hidden text-lg font-black tracking-[-0.04em] sm:inline">
                                FORK&apos;D <span className="text-primarygreen">NUCES</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1 xl:flex">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    href={link.href}
                                    key={link.href}
                                    aria-current={isActive(link.href) ? "page" : undefined}
                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                        isActive(link.href)
                                            ? "bg-white/15 text-white"
                                            : "text-white/65 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            ref={mobileToggleRef}
                            type="button"
                            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={isMenuOpen}
                            aria-controls="platform-mobile-drawer"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 xl:hidden"
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
                                className="flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 pr-2 transition-colors hover:bg-white/15"
                            >
                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/15">
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
                                <div id="profile-menu" className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-black/10 bg-white p-2 text-black shadow-2xl">
                                    <div className="border-b border-black/[0.07] px-3 py-2.5">
                                        <p className="truncate text-sm font-bold">{user?.full_name || "Your account"}</p>
                                        <p className="mt-0.5 truncate text-xs text-black/45">{user?.nu_email}</p>
                                    </div>
                                    <Link onClick={() => setIsProfileOpen(false)} href="/profile" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 hover:bg-primarypurple/[0.06] hover:text-primarypurple">
                                        <User className="h-4 w-4" aria-hidden="true" /> Profile
                                    </Link>
                                    <Link href="/profile/reports" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 hover:bg-primarypurple/[0.06] hover:text-primarypurple">
                                        <ClipboardList className="h-4 w-4" aria-hidden="true" /> My reports
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            logoutMutation.reset();
                                            logoutMutation.mutate();
                                        }}
                                        disabled={logoutMutation.isPending}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
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
                    <aside ref={mobileDrawerRef} id="platform-mobile-drawer" className="landing-drawer-in fixed left-0 top-0 z-50 h-dvh w-[86vw] max-w-[360px] bg-white shadow-2xl xl:hidden" role="dialog" aria-modal="true" aria-label="Platform navigation" tabIndex={-1}>
                        <div className="flex h-20 items-center justify-between border-b border-black/10 px-5">
                            <span className="text-lg font-black">FORK&apos;D <span className="text-primarypurple">NUCES</span></span>
                            <button type="button" aria-label="Close navigation menu" className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.05]" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <nav className="space-y-1 px-5 py-6" aria-label="Mobile platform navigation">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    href={link.href}
                                    key={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    aria-current={isActive(link.href) ? "page" : undefined}
                                    className={`block rounded-xl px-3 py-3 text-base font-bold ${
                                        isActive(link.href)
                                            ? "bg-primarypurple text-white"
                                            : "text-black/65 hover:bg-primarypurple/[0.06] hover:text-primarypurple"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
