import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Home",
    description: "Open-source your projects within FAST and collaborate with fellow FASTians.",
};

export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <a
                href="#main-content"
                className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-xl bg-primarygreen px-4 py-2 font-bold text-black shadow-lg transition-transform focus:translate-y-0"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="main-content">{children}</main>
            <Footer />
        </>
    );
}
