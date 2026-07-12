import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Verify Email",
    description: "Verify the NU email attached to your FORKED NUCES account.",
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
    return children;
}
