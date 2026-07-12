import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Collaborations",
    description: "Manage collaboration applications and invitations.",
};

export default function CollaborationsLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
