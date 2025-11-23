import { Metadata } from "next";
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

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
        <>
            <Navbar />
            <div className="mt-24 min-h-[calc(100vh-128px)]">
                {children}
            </div>
        </>
    );
}
