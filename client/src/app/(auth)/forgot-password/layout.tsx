import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Request a secure password reset link for your account.",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
    return children;
}
