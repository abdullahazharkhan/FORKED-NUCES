import type { Metadata } from "next";

import Navbar from "../components/Navbar";

export const metadata: Metadata = {
    title: "Collaborations | FORKED NUCES",
    description: "Manage collaboration applications and invitations.",
};

export default function CollaborationsLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Navbar />
            <div className="mt-24 min-h-[calc(100vh-128px)]">{children}</div>
        </>
    );
}
