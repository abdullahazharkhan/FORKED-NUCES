import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contributor Leaderboard",
    description: "See the most active FORKED NUCES community contributors.",
};

export default function LeaderboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
