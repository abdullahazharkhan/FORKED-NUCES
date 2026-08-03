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
        <div className="relative mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
            <div
                className="pointer-events-none absolute -left-24 top-16 -z-10 h-64 w-64 rounded-full bg-primarygreen/[0.07] blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-24 top-52 -z-10 h-72 w-72 rounded-full bg-primarypurple/[0.07] blur-3xl"
                aria-hidden="true"
            />
            <Link
                href="/platform"
                className="group mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/[0.06] bg-white/80 px-4 text-sm font-bold text-black/60 shadow-[0_6px_20px_rgba(24,15,48,0.05)] backdrop-blur-sm transition-[transform,color,box-shadow,border-color] hover:-translate-y-0.5 hover:border-primarypurple/15 hover:text-primarypurple hover:shadow-[0_9px_24px_rgba(24,15,48,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15 active:translate-y-0"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                Back to explore
            </Link>
            {children}
        </div>
    );
}
