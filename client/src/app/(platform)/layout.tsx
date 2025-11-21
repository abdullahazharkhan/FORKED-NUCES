import { Metadata } from "next";
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

export const metadata: Metadata = {
    title: "FORKED NUCES",
    description: "",
};

export default function PlatformLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
