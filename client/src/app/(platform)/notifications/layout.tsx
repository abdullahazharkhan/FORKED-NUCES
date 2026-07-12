import type { Metadata } from "next";

import Navbar from "../components/Navbar";

export const metadata: Metadata = {
    title: "Notifications | FORKED NUCES",
    description: "Review activity and collaboration updates.",
};

export default function NotificationsLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Navbar />
            <div className="mt-24 min-h-[calc(100vh-128px)]">{children}</div>
        </>
    );
}
