"use client";

import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
} from "@heroui/react";
import React from "react";
import { usePathname } from "next/navigation";

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
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const pathname = usePathname();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSmoothScroll = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const isActive = (href: string) => {
        return pathname === href;
    };

    const activeClass = "text-[#04B2D9]";
    const baseLinkClass = "text-black hover:text-black/70 transition-colors duration-200";

    return (
        <Navbar
            shouldHideOnScroll
            onMenuOpenChange={setIsMenuOpen}
            className={
                isScrolled
                    ? "backdrop-blur-sm bg-white/70"
                    : isMenuOpen
                        ? "bg-white/70 backdrop-blur-sm"
                        : "bg-transparent"
            }
        >
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

            {/* Desktop nav */}
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem isActive={isActive("/")}>
                    <Link
                        href="/"
                        className={`${baseLinkClass} ${isActive("/") ? activeClass : ""}`}
                    >
                        Home
                    </Link>
                </NavbarItem>
                <NavbarItem isActive={isActive("/about")}>
                    <Link
                        href="/about"
                        className={`${baseLinkClass} ${isActive("/about") ? activeClass : ""}`}
                    >
                        About
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* Right actions */}
            <NavbarContent className="hidden sm:flex" justify="end">
                <NavbarItem>
                    <Button
                        as={Link}
                        className="bg-transparent text-black"
                        href="/login"
                        variant="bordered"
                    >
                        Login
                    </Button>
                </NavbarItem>
                <NavbarItem>
                    <Button
                        as={Link}
                        className="bg-primaryblue text-white"
                        href="/signup"
                        variant="solid"
                    >
                        Sign Up
                    </Button>
                </NavbarItem>
            </NavbarContent>

            {/* Mobile menu */}
            <NavbarMenu className="border-t border-gray-300">
                <NavbarMenuItem>
                    <Link
                        className={`w-full ${baseLinkClass} ${isActive("/") ? activeClass : ""
                            }`}
                        href="/"
                        size="lg"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Home
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Link
                        className={`w-full ${baseLinkClass} ${isActive("/about") ? activeClass : ""
                            }`}
                        href="/about"
                        size="lg"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        About
                    </Link>
                </NavbarMenuItem>

                <div className="flex w-full gap-4 mt-2">
                    <NavbarMenuItem className="flex-1">
                        <Button
                            as={Link}
                            className="bg-transparent text-black w-full"
                            href="/login"
                            variant="ghost"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Login
                        </Button>
                    </NavbarMenuItem>
                    <NavbarMenuItem className="flex-1">
                        <Button
                            as={Link}
                            className="bg-primaryblue text-white w-full"
                            href="/signup"
                            variant="solid"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Sign Up
                        </Button>
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </Navbar>
    );
}
