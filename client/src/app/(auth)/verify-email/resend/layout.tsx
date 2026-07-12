import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Resend Verification Email",
    description: "Request a fresh FORKED NUCES email verification link.",
};

export default function ResendVerificationLayout({ children }: { children: ReactNode }) {
    return children;
}
