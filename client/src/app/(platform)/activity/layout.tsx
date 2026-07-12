import type { Metadata } from "next";

import Navbar from "../components/Navbar";

export const metadata: Metadata = {
    title: "Community Activity",
    description: "Review recent community events and your contribution statistics.",
};

export default function ActivityLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Navbar />
            <div className="mt-24 min-h-[calc(100vh-128px)]">{children}</div>
        </>
    );
}
