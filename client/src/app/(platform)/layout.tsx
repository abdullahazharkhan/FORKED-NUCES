import type { ReactNode } from "react";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function PlatformRootLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col bg-[#f4f3f8]">
            <a
                href="#platform-main"
                className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-primarygreen px-4 py-2 font-bold text-black transition-transform focus:translate-y-0"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="platform-main" className="min-h-[calc(100svh-5rem)] flex-1 pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
