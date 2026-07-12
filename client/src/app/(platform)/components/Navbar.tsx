"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { Menu, X, User, LogOut, ChevronDown, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authFetch } from "@/lib/authFetch";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";

const NAV_LINKS = [
    { name: "Explore", href: "/platform" },
    { name: "Users", href: "/platform/users" },
    { name: "Recommended Projects", href: "/platform/recommended" },
    { name: "Collaborations", href: "/collaborations" },
    { name: "Activity", href: "/activity" },
    { name: "Leaderboard", href: "/leaderboard" },
] as const;

const DRAWER_FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Navbar = () => {
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

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await authFetch("/api/auth/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as {
                    detail?: string;
                } | null;
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

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-between items-center px-6 py-4 font-poppins tracking-er
        ${scrolled ? "bg-black/90 backdrop-blur-lg supports-[backdrop-filter]:bg-black/90 shadow-sm" : "bg-black"}`}
            >
                <div className="flex items-center gap-8">

                    <Link href="/platform" className="flex items-center gap-4">
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt="FORKED NUCES home"
                            width={200}
                            height={200}
                            className="w-14 h-14 rounded-xl"
                        />
                    </Link>

                    <div className="hidden items-center gap-4 xl:flex">
                        {NAV_LINKS.map((link) => (
                            <Link
                                href={link.href}
                                key={link.href}
                                className="text-base font-bold text-white hover:text-white/80 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        ref={mobileToggleRef}
                        type="button"
                        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-drawer"
                        className="flex h-14 cursor-pointer place-items-center xl:hidden"
                        onClick={() => setIsMenuOpen((p) => !p)}
                    >
                        <Menu
                            strokeWidth={4}
                            className="text-white"
                            size={35}
                            aria-hidden="true"
                        />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <div className="relative" ref={profileRef}>
                    <button
                        ref={profileButtonRef}
                        type="button"
                        onClick={() => setIsProfileOpen((open) => !open)}
                        aria-label={isProfileOpen ? "Close account menu" : "Open account menu"}
                        aria-expanded={isProfileOpen}
                        aria-controls="profile-menu"
                        className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            {
                                user?.avatar_url ?
                                    (<Image loader={passthroughImageLoader} unoptimized src={user.avatar_url} alt="User Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />)
                                    : (
                                        <User className="text-white w-6 h-6" aria-hidden="true" />
                                    )
                            }
                        </div>
                        <p className="hidden text-lg font-bold sm:block">
                            {user?.full_name.split(" ")[0] || "User"}
                        </p>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                            aria-hidden="true"
                        />
                    </button>

                    {isProfileOpen && (
                        <div id="profile-menu" className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2">
                            <Link onClick={() => setIsProfileOpen(false)} href="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                                <User className="w-4 h-4" aria-hidden="true" />
                                <span>Profile</span>
                            </Link>
                            <Link
                                href="/profile/reports"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2 rounded-xl px-4 py-2 text-gray-800 transition-colors hover:bg-gray-100"
                            >
                                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                                <span>My Reports</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    logoutMutation.reset();
                                    logoutMutation.mutate();
                                }}
                                disabled={logoutMutation.isPending}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left rounded-xl disabled:opacity-60">
                                <LogOut className="w-4 h-4" aria-hidden="true" />
                                <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
                            </button>
                            {logoutMutation.isError && (
                                <p className="px-4 py-2 text-sm text-red-700" role="alert">
                                    {logoutMutation.error.message}
                                </p>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            </nav>

            {isMenuOpen && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-black/50 xl:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    <aside
                        ref={mobileDrawerRef}
                        id="mobile-drawer"
                        className="fixed right-0 top-0 z-50 h-screen w-[80vw] max-w-[360px]
                            bg-white/90 backdrop-blur-xl shadow-2xl border-l border-white/30 xl:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between px-5 h-16 mt-3">
                            <div className="flex items-center gap-3">
                                <span className="font-bold tracking-tighter text-2xl">Menu</span>
                            </div>
                            <button
                                type="button"
                                aria-label="Close menu"
                                aria-controls="mobile-drawer"
                                className="flex h-14 cursor-pointer place-items-center xl:hidden"
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
                            <nav className="flex flex-col gap-4" aria-label="Mobile navigation links">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        href={link.href}
                                        key={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg md:text-xl font-bold text-black hover:text-black/80 tracking-tighter transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
