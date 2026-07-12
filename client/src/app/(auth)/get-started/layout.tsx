import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Create Account",
    description: "Create your verified FORKED NUCES builder profile.",
};

export default function RegistrationLayout({ children }: { children: ReactNode }) {
    return children;
}
