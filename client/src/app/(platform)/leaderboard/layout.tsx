import type { Metadata } from "next";

import Navbar from "../components/Navbar";

export const metadata: Metadata = {
    title: "Contributor Leaderboard",
    description: "See the most active FORKED NUCES community contributors.",
};

export default function LeaderboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Navbar />
            <div className="mt-24 min-h-[calc(100vh-128px)]">{children}</div>
        </>
    );
}
