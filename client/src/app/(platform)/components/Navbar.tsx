"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

const Navbar = () => {
    const router = useRouter();
    const authStore = useAuthStore.getState();


    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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

    const navLinks = [
        { name: "Explore", href: "/explore" },
        { name: "Users", href: "/users" },
        { name: "Recommended Projects", href: "/recommended" },
    ];

    const handleLogout = () => {
        fetch("/api/auth/logout", {
            method: "POST",
        })
            .then((res) => {
                if (res.ok) {
                    setIsProfileOpen(false);
                    setIsMenuOpen(false);
                    authStore.clearUser();
                    router.push("/login");
                }
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    }

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-between items-center px-6 py-4 font-poppins tracking-er
        ${scrolled ? "bg-primarypurple/50 backdrop-blur-lg supports-[backdrop-filter]:bg-primarypurple/50 shadow-sm" : "bg-black"}`}
            >
                <div className="flex items-center gap-8">

                    <Link href="/platform" className="flex items-center gap-4">
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt="Logo"
                            width={200}
                            height={200}
                            className="w-14 h-14 rounded-xl"
                        />
                    </Link>

                    <div className="gap-8 hidden md:flex items-center">
                        {navLinks.map((link) => (
                            <Link
                                href={link.href}
                                key={link.href}
                                className="text-lg font-bold text-white hover:text-white/80 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-drawer"
                        className="flex md:hidden h-14 place-items-center cursor-pointer"
                        onClick={() => setIsMenuOpen((p) => !p)}
                    >
                        <Menu strokeWidth={4} className="text-white" size={35} />
                    </button>
                </div>

                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            <User className="text-white w-6 h-6" />
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2">
                            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors">
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left">
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <button
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                aria-hidden={!isMenuOpen}
                onClick={() => setIsMenuOpen(false)}
            />

            <aside
                id="mobile-drawer"
                className={`fixed right-0 top-0 z-50 h-screen w-[80vw] max-w-[360px]
                    bg-white/90 backdrop-blur-xl shadow-2xl border-l border-white/30
                    transition-transform duration-300 md:hidden
                    ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-5 h-16 mt-3">
                    <div className="flex items-center gap-3">
                        <span className="font-bold tracking-tighter text-2xl">Menu</span>
                    </div>
                    <button
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-drawer"
                        className="flex md:hidden h-14 place-items-center cursor-pointer"
                        onClick={() => setIsMenuOpen((p) => !p)}
                    >
                        <X strokeWidth={4} className="text-black" size={35} />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <nav className="flex flex-col gap-4">
                        {navLinks.map((link) => (
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
    );
};

export default Navbar;
