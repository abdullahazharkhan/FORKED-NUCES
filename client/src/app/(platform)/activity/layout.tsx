import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Activity",
    description: "Review recent community events and your contribution statistics.",
};

export default function ActivityLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
