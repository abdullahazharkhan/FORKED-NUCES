import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Submitted Reports",
    description: "Track the moderation status of reports you submitted.",
};

export default function ReportsLayout({ children }: { children: ReactNode }) {
    return children;
}
