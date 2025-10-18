"use client";

import Image from "next/image";
import { Navbar, NavbarContent, NavbarItem, Button, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const Logo = () => {
    return (
        <Link href="/" className="cursor-pointer">
            <Image src="/logos/forkednuces-logo.png" alt="FORKED NUCES" width={600} height={600} className="w-15 h-15 rounded-md" />
        </Link>
    );
};

export default function App() {
    const navLinks = [
        { name: "Features", href: "#features" },
        { name: "Use Cases", href: "#usecases" },
        { name: "About", href: "#about" },
    ]

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <Navbar onMenuOpenChange={setIsMenuOpen} shouldHideOnScroll className={`${isMenuOpen ? "backdrop-blur-lg" : (isScrolled ? "bg-white/50 backdrop-blur-lg" : "bg-transparent")} transition-colors duration-300`}>
            <NavbarContent className="">
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <div className="hidden sm:block">
                    <Logo />
                </div>
                <div className="hidden sm:flex gap-4">
                    {navLinks.map((link) => (
                        <NavbarItem key={link.name}>
                            <Link className="text-primaryblue text-2xl font-semibold" href={link.href}>
                                {link.name}
                            </Link>
                        </NavbarItem>
                    ))}
                </div>
            </NavbarContent>
            <NavbarContent justify="end">
                <div className="block sm:hidden">
                    <Logo />
                </div>
                <NavbarItem className="hidden sm:flex">
                    <Link href="/login" className="text-primaryblue hover:text-primaryblue/80 transition-colors duration-300 text-lg">Login</Link>
                </NavbarItem>
                <NavbarItem className="hidden sm:flex">
                    <Button as={Link} className="bg-primaryblue text-white text-lg rounded-md" href="/signup" variant="flat">
                        Get Started
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarMenu className="">
                {navLinks.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`}>
                        <Link
                            className="w-full text-primaryblue text-lg"
                            href={item.href}
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}

                <NavbarMenuItem className="w-full flex gap-4 mt-2">
                    <Button as={Link} className="text-primaryblue w-1/2 border-primaryblue rounded-md hover:bg-primaryblue/10 bg-transparent border-2 text-lg" href="/login">
                        Login
                    </Button>
                    <Button as={Link} className="bg-primaryblue rounded-md text-white w-1/2 text-lg" href="/signup" variant="flat">
                        Sign Up
                    </Button>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}
