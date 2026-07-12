import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "People",
    description: "Meet FASTians and discover the skills and projects they share.",
};

export default function UsersLayout({ children }: { children: ReactNode }) {
    return children;
}
