import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Explore",
    description: "Discover projects and contributors across FORKED NUCES.",
};

export default function PlatformLayout({ children }: { children: ReactNode }) {
    return children;
}
