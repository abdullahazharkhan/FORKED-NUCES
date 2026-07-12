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
                className="group mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 text-sm font-bold text-black/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primarypurple/30 hover:text-primarypurple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                Back to explore
            </Link>
            {children}
        </div>
    );
}
