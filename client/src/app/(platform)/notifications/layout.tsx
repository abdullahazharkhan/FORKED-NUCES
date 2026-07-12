import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Notifications",
    description: "Review activity and collaboration updates.",
};

export default function NotificationsLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
