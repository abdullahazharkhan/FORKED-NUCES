"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowRight,
    BadgeCheck,
    CircleAlert,
    MailCheck,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";

import { verifyEmail } from "@/lib/authClient";

type VerifyPayload = {
    token: string;
    nu_email: string;
};

type VerifyResult = { message?: string };

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const isAlreadyVerifiedError = (err: unknown): boolean => {
    const e = err as ApiError | undefined;
    if (!e?.body || typeof e.body !== "object" || Array.isArray(e.body)) return false;

    const body = e.body as Record<string, unknown>;
    const value = body["non_field_errors"];

    return Array.isArray(value) && value[0] === "This token has already been used.";
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;

    if (!e) return "Verification failed";

    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const body = e.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];

        if (firstKey) {
            const value = body[firstKey];

            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }
            if (typeof value === "string") {
                return value;
            }
        }
    }

    if (typeof e.body === "string") return e.body;
    if (e.detail) return e.detail;
    if (e.message) return e.message;

    if (e.status) {
        return `${e.status} ${e.statusText || ""}`.trim();
    }

    return "Verification failed";
};

function VerifyEmailInner() {
    const searchParams = useSearchParams();

    const token = searchParams.get("token");
    const nu_email = searchParams.get("nu_email");

    const mutation = useMutation<VerifyResult, unknown, VerifyPayload>({
        mutationFn: async (payload: VerifyPayload) => {
            return await verifyEmail(payload);
        },
    });

    const triggeredVerification = useRef<string | null>(null);
    const verify = mutation.mutate;
    const verificationKey =
        token && nu_email ? `${nu_email}\u0000${token}` : null;

    useEffect(() => {
        if (!verificationKey || !token || !nu_email) return;
        if (triggeredVerification.current === verificationKey) return;

        triggeredVerification.current = verificationKey;
        verify({ token, nu_email });
    }, [token, nu_email, verificationKey, verify]);

    let content: ReactNode = null;

    if (!token || !nu_email) {
        content = (
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <CircleAlert className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                    Link problem
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    This verification link is incomplete.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55" role="alert">
                    The link is missing required information. Request a fresh email
                    and open the complete link from your inbox.
                </p>
                <Link
                    href="/verify-email/resend"
                    className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Request a fresh email
                </Link>
            </div>
        );
    } else if (mutation.isIdle || mutation.isPending) {
        content = (
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                    <Spinner color="secondary" size="lg" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    One moment
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Verifying your email.
                </h1>
                <p className="mx-auto mt-4 max-w-md break-words text-sm leading-6 text-black/55">
                    We&apos;re securely confirming{" "}
                    <span className="font-bold text-black">{nu_email}</span>. This
                    should only take a few seconds.
                </p>
            </div>
        );
    } else if (mutation.isError) {
        if (isAlreadyVerifiedError(mutation.error)) {
            content = (
                <div className="text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primarygreen/25 text-primarypurple">
                        <BadgeCheck className="h-8 w-8" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                        Already verified
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                        You&apos;re ready to build.
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55" role="status">
                        This email has already been verified. You can safely log in
                        and continue to your account.
                    </p>
                    <Link
                        href="/login"
                        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                    >
                        Continue to login
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            );
        } else {
            const msg = getErrorMessage(mutation.error);

            content = (
                <div className="text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <CircleAlert className="h-8 w-8" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                        Verification failed
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                        We couldn&apos;t verify this link.
                    </h1>
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-left text-sm leading-6 text-red-700" role="alert">
                        {msg}
                    </div>
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-primarypurple/15 bg-primarypurple/[0.04] p-4 text-left text-sm leading-6 text-black/60">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primarypurple" aria-hidden="true" />
                        <p>
                            Verification links can expire or be used only once. A
                            fresh email will give you a new secure link.
                        </p>
                    </div>
                    <Link
                        href="/verify-email/resend"
                        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Resend verification email
                    </Link>
                </div>
            );
        }
    } else if (mutation.isSuccess) {
        const result = mutation.data as { message?: string } | undefined;
        const successMsg =
            result?.message || "Your email has been successfully verified.";

        content = (
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primarygreen/25 text-primarypurple">
                    <MailCheck className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    Verification complete
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Your NU email is verified.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55" role="status">
                    {successMsg} Log in to start exploring projects and connecting
                    with collaborators.
                </p>
                <Link
                    href="/login"
                    className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                >
                    Continue to login
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>
        );
    }

    return (
        <div className="landing-fade-up">
            <div
                aria-live="polite"
                className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-8"
            >
                {content}
            </div>
        </div>
    );
}

const VerifyEmail = () => (
    <Suspense
        fallback={
            <div className="flex min-h-80 items-center justify-center gap-3" role="status">
                <Spinner size="sm" color="secondary" />
                <span className="text-sm text-black/50">Preparing verification...</span>
            </div>
        }
    >
        <VerifyEmailInner />
    </Suspense>
);

export default VerifyEmail;
