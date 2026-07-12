import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Log In",
    description: "Log in to your FORKED NUCES account.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
    return children;
}
