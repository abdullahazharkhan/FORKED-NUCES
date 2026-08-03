"use client";

import Image from "next/image";
import { BookOpenText, Check, Github, Mail, Sparkles } from "lucide-react";

import { useAuthStore } from "@/stores";
import type { UserType } from "@/stores/auth/useAuthStore";
import { passthroughImageLoader } from "@/lib/passthroughImageLoader";
import { ReportButton } from "@/app/(platform)/components/ReportButton";

type UserDetailsProps = {
    page: "profile" | "userDetails";
    user?: UserType;
};

const UserDetails = ({ user: propUser, page }: UserDetailsProps) => {
    const storeUser = useAuthStore((state) => state.user);
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const user = propUser ?? storeUser;

    if (!user) {
        return (
            <div
                className="relative isolate overflow-hidden rounded-3xl border border-black/[0.06] bg-gradient-to-br from-white via-white to-primarypurple/[0.035] p-6 shadow-[0_18px_55px_rgba(24,15,48,0.07)] sm:p-8"
                role={
                    sessionStatus === "error" || sessionStatus === "unauthenticated"
                        ? "alert"
                        : "status"
                }
            >
                <div
                    className="absolute -left-16 -top-16 -z-10 h-48 w-48 rounded-full bg-primarygreen/10 blur-3xl"
                    aria-hidden="true"
                />
                <div className="flex animate-pulse flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="h-28 w-28 rounded-3xl bg-primarypurple/[0.08] shadow-inner" />
                    <div className="flex-1 space-y-3">
                        <div className="h-8 w-48 rounded-full bg-black/10" />
                        <div className="h-4 w-64 max-w-full rounded-full bg-black/[0.06]" />
                        <div className="h-7 w-24 rounded-full bg-primarypurple/10" />
                    </div>
                </div>
                <p className="mt-5 text-sm text-black/50">
                    {sessionStatus === "error" || sessionStatus === "unauthenticated"
                        ? "Unable to load this profile. Refresh the page or sign in again."
                        : "Loading profile…"}
                </p>
            </div>
        );
    }

    const displayName =
        user.full_name?.trim().split(/\s+/).slice(0, 2).join(" ") || "FASTian";
    const email = user.nu_email || "Email unavailable";
    const avatarInitial = user.full_name?.trim().charAt(0)?.toUpperCase() || "U";
    const canReport =
        page === "userDetails" &&
        Boolean(storeUser) &&
        storeUser?.user_id !== user.user_id;

    return (
        <section
            className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#754cf2] via-primarypurple to-[#4520a8] p-6 text-white shadow-[0_24px_70px_rgba(45,19,118,0.22)] sm:p-8 lg:p-10"
            aria-labelledby="profile-name"
        >
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-35"
                aria-hidden="true"
            />
            <div
                className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-primarygreen/80 to-transparent"
                aria-hidden="true"
            />
            <div
                className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-primarygreen/10 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="absolute -bottom-32 left-1/3 -z-10 h-64 w-64 rounded-full bg-white/[0.07] blur-3xl"
                aria-hidden="true"
            />

            {canReport && (
                <div className="relative mb-5 flex justify-end">
                    <ReportButton
                        targetType="user"
                        targetId={user.user_id}
                        targetLabel={displayName}
                    />
                </div>
            )}

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-stretch lg:gap-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="shrink-0">
                        {user.avatar_url ? (
                            <Image
                                loader={passthroughImageLoader}
                                unoptimized
                                src={user.avatar_url}
                                alt={`${displayName} avatar`}
                                width={144}
                                height={144}
                                className="h-28 w-28 rounded-3xl object-cover shadow-[0_18px_45px_rgba(20,10,50,0.25)] ring-1 ring-white/25 sm:h-36 sm:w-36"
                            />
                        ) : (
                            <div
                                className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 font-jaro text-5xl text-primarygreen shadow-[0_18px_45px_rgba(20,10,50,0.22)] ring-1 ring-white/20 backdrop-blur-sm sm:h-36 sm:w-36"
                                aria-hidden="true"
                            >
                                {avatarInitial}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="font-mono text-xs font-black tracking-[0.16em] text-primarygreen">
                            {page === "profile" ? "Your profile" : "Community member"}
                        </p>
                        <h1
                            id="profile-name"
                            className="mt-3 break-words text-4xl font-bold leading-none tracking-[-0.05em] sm:text-5xl lg:text-6xl"
                        >
                            {displayName}
                        </h1>
                        <p className="mt-2 flex min-w-0 items-start gap-2 break-all text-sm text-white/90 sm:text-base">
                            <Mail
                                className="mt-0.5 h-4 w-4 shrink-0 text-primarygreen"
                                aria-hidden="true"
                            />
                            {email}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {user.is_email_verified ? (
                                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primarygreen px-3 py-1.5 text-xs font-black text-black shadow-[0_7px_18px_rgba(183,255,0,0.16)]">
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    Verified FASTian
                                </span>
                            ) : (
                                <span className="inline-flex min-h-9 items-center rounded-xl bg-red-400/20 px-3 py-1.5 text-xs font-bold text-red-100 ring-1 ring-inset ring-red-300/25">
                                    Email not verified
                                </span>
                            )}
                            {user.is_github_connected && user.github_username && (
                                <a
                                    href={`https://github.com/${encodeURIComponent(user.github_username)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 active:translate-y-0"
                                >
                                    <Github className="h-3.5 w-3.5" aria-hidden="true" />
                                    @{user.github_username}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#2d126f]/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(20,10,50,0.12)] backdrop-blur-sm sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 font-mono text-sm font-black tracking-[0.13em] text-primarygreen">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Skills
                        </h2>
                        {user.skills && user.skills.length > 0 && (
                            <span className="rounded-xl bg-white/10 px-2.5 py-1 font-mono text-[0.65rem] font-bold text-white/90 ring-1 ring-inset ring-white/10">
                                {user.skills.length.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {user.skills && user.skills.length > 0 ? (
                            user.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-xl border border-primarygreen/15 bg-primarygreen/10 px-3 py-1.5 text-xs font-bold text-white/90"
                                >
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm leading-6 text-white/90">
                                {page === "profile"
                                    ? "Add skills below so better project recommendations can find you."
                                    : "This member has not listed any skills yet."}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.07] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-6">
                <p className="flex items-center gap-2 font-mono text-xs font-black tracking-[0.15em] text-primarygreen">
                    <BookOpenText className="h-4 w-4" aria-hidden="true" />
                    About
                </p>
                <p className="mt-2 max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-white/90 sm:text-base">
                    {user.bio ||
                        (page === "profile"
                            ? "Tell the community what you build, what you are learning, and what you would like to collaborate on."
                            : "This member has not added a bio yet.")}
                </p>
            </div>
        </section>
    );
};

export default UserDetails;
