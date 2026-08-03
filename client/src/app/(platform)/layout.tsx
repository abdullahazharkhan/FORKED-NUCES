import type { ReactNode } from "react";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function PlatformRootLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[radial-gradient(circle_at_12%_8%,rgba(183,255,0,0.09),transparent_24rem),radial-gradient(circle_at_86%_14%,rgba(111,60,255,0.12),transparent_31rem),linear-gradient(180deg,#f8f7fc_0%,#f4f2f9_48%,#f8f7fb_100%)]">
            <a
                href="#platform-main"
                className="fixed left-5 top-4 z-[70] -translate-y-24 rounded-xl border border-black/10 bg-primarygreen px-4 py-2.5 text-sm font-bold text-black shadow-lg transition-transform focus-visible:translate-y-0"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="platform-main" className="min-h-[calc(100dvh-5.5rem)] flex-1 pt-[5.5rem]">
                {children}
            </main>
            <Footer />
        </div>
    );
}
