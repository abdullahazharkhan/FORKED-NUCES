"use client";

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/react";
import { useEffect, useState } from "react";

export const AcmeLogo = () => {
    return (
        <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
            <path
                clipRule="evenodd"
                d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
};

export default function App() {
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
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
        // <Navbar onMenuOpenChange={setIsMenuOpen} shouldHideOnScroll className={`${isScrolled ? "bg-black/10 backdrop-blur-lg" : "bg-transparent"} transition-colors duration-300`}>
        <Navbar onMenuOpenChange={setIsMenuOpen} shouldHideOnScroll className={`${isMenuOpen ? "bg-primarybackground backdrop-blur-lg" : (isScrolled ? "bg-black/10 backdrop-blur-lg" : "bg-transparent")} transition-colors duration-300`}>
            <NavbarContent>
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <NavbarBrand>
                    <AcmeLogo />
                    <p className="font-bold text-inherit">FORKED NUCES</p>
                </NavbarBrand>
            </NavbarContent>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                {navLinks.map((link) => (
                    <NavbarItem key={link.name}>
                        <Link color="foreground" href={link.href}>
                            {link.name}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem className="hidden sm:flex">
                    <Link href="/login" className="text-primaryblue hover:text-primaryblue transition-colors duration-200">Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button as={Link} className="bg-primaryblue/80" href="/signup" variant="flat">
                        Get Started
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarMenu className="bg-primarybackground">
                {navLinks.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`}>
                        <Link
                            className="w-full text-foreground"
                            href={item.href}
                            size="lg"
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    );
}
