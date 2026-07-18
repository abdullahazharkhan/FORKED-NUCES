import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Profile",
    description: "Manage your FORKED NUCES profile, projects, security, and account data.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
            <Link
                href="/platform"
                className="group mb-7 inline-flex min-h-10 items-center gap-2 rounded-md border-b border-black/15 px-1 text-sm font-bold text-black/60 transition-colors hover:border-primarypurple/40 hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15 active:translate-y-px"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                Back to explore
            </Link>
            {children}
        </div>
    );
}
