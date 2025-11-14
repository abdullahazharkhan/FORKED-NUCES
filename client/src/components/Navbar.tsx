"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [
        { name: "Use Cases", href: "#usecases" },
        { name: "Features", href: "#features" },
        { name: "About", href: "#about" },
    ];

    const handleNavClick = (href: string) => {
        const id = href.replace("#", "");
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-between items-center px-6 py-4 font-poppins tracking-er er
        ${scrolled ? "bg-primarypurple/50 backdrop-blur-lg supports-[backdrop-filter]:bg-primarypurple/50 shadow-sm" : "bg-transparent"}`}
            >
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-4">
                        <Image
                            src="/logos/forkednuces-logo-bw-invert.png"
                            alt="Logo"
                            width={200}
                            height={200}
                            className="w-14 h-14 rounded-xl"
                        />
                        <h1 className="font-bold text-white text-2xl md:hidden">FORKED NUCES</h1>
                    </Link>

                    {/* Desktop nav */}
                    <div className="gap-8 hidden md:flex">
                        {navLinks.map((link) => (
                            <Link
                                href={link.href}
                                key={link.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavClick(link.href);
                                }}
                                className="text-lg md:text-xl lg:text-2xl font-bold text-white hover:text-white/80 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Desktop buttons */}
                <div className="hidden md:flex items-center gap-2">
                    <Link
                        href="/login"
                        className="text-lg md:text-xl lg:text-2xl font-bold text-white bg-black hover:bg-black/80 transition-all rounded-xl px-8 h-14 flex items-center justify-center"
                    >
                        Login
                    </Link>
                    <Link
                        href="/get-started"
                        className="text-lg md:text-xl lg:text-2xl font-bold text-white bg-black hover:bg-black/80 transition-all rounded-xl px-8 h-14 flex items-center justify-center"
                    >
                        Get Started
                    </Link>
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
            </nav>

            {/* Backdrop */}
            <button
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                aria-hidden={!isMenuOpen}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Right slide-in drawer */}
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
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavClick(link.href);
                                }}
                                className="text-lg md:text-xl lg:text-2xl font-bold text-black hover:text-black/80 tracking-tighter transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-6 h-px bg-black" />

                    <div className="mt-6 flex flex-col gap-3">
                        <Link
                            href="/login"
                            className="text-lg md:text-xl lg:text-2xl font-bold text-white bg-black hover:bg-black/80 transition-all rounded-xl px-8 h-14 flex items-center justify-center"
                        >
                            Login
                        </Link>
                        <Link
                            href="/get-started"
                            className="text-lg md:text-xl lg:text-2xl font-bold text-white bg-black hover:bg-black/80 transition-all rounded-xl px-8 h-14 flex items-center justify-center"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Navbar;
