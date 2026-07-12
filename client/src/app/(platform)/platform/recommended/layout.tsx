import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Recommended Projects",
    description: "Discover projects recommended around your skills and community activity.",
};

export default function RecommendedLayout({ children }: { children: ReactNode }) {
    return children;
}
