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
import {
    AUTH_ACTION_LINK_CLASS,
    AUTH_ERROR_STEP_CLASS,
    AUTH_ERROR_STEP_NUMBER_CLASS,
    AUTH_PAGE_CLASS,
    AUTH_STATUS_SHELL_CLASS,
    AUTH_STEP_CLASS,
    AUTH_STEP_NUMBER_CLASS,
    AUTH_TITLE_CLASS,
} from "@/lib/authFormStyles";

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
            <>
                <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                    <p className={AUTH_ERROR_STEP_CLASS}>
                        <span className={AUTH_ERROR_STEP_NUMBER_CLASS}>ERR</span>
                        Link problem
                    </p>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-red-50 text-red-600">
                        <CircleAlert className="h-6 w-6" aria-hidden="true" />
                    </span>
                </div>
                <h1 className={AUTH_TITLE_CLASS}>This verification link is incomplete.</h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-black/55" role="alert">
                    The link is missing required information. Request a fresh email
                    and open the complete link from your inbox.
                </p>
                <Link
                    href="/verify-email/resend"
                    className={`${AUTH_ACTION_LINK_CLASS} mt-7`}
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Request a fresh email
                </Link>
            </>
        );
    } else if (mutation.isIdle || mutation.isPending) {
        content = (
            <>
                <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                    <p className={AUTH_STEP_CLASS}>
                        <span className={AUTH_STEP_NUMBER_CLASS}>02</span>
                        Checking token
                    </p>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primarypurple/10 text-primarypurple">
                        <Spinner color="secondary" size="sm" />
                    </span>
                </div>
                <h1 className={AUTH_TITLE_CLASS}>Verifying your email.</h1>
                <p className="mt-5 max-w-md break-words text-sm leading-6 text-black/55">
                    We&apos;re securely confirming{" "}
                    <span className="font-semibold text-black">{nu_email}</span>. This
                    should only take a few seconds.
                </p>
                <div className="mt-7 h-1 w-full overflow-hidden bg-black/[0.06]" aria-hidden="true">
                    <div className="h-full w-2/3 animate-pulse bg-primarypurple" />
                </div>
            </>
        );
    } else if (mutation.isError) {
        if (isAlreadyVerifiedError(mutation.error)) {
            content = (
                <>
                    <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                        <p className={AUTH_STEP_CLASS}>
                            <span className={AUTH_STEP_NUMBER_CLASS}>OK</span>
                            Already verified
                        </p>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primarygreen text-black">
                            <BadgeCheck className="h-6 w-6" aria-hidden="true" />
                        </span>
                    </div>
                    <h1 className={AUTH_TITLE_CLASS}>You&apos;re ready to build.</h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-black/55" role="status">
                        This email has already been verified. You can safely log in
                        and continue to your account.
                    </p>
                    <Link
                        href="/login"
                        className={`${AUTH_ACTION_LINK_CLASS} mt-7`}
                    >
                        Continue to login
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </>
            );
        } else {
            const msg = getErrorMessage(mutation.error);

            content = (
                <>
                    <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                        <p className={AUTH_ERROR_STEP_CLASS}>
                            <span className={AUTH_ERROR_STEP_NUMBER_CLASS}>ERR</span>
                            Verification failed
                        </p>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-red-50 text-red-600">
                            <CircleAlert className="h-6 w-6" aria-hidden="true" />
                        </span>
                    </div>
                    <h1 className={AUTH_TITLE_CLASS}>We couldn&apos;t verify this link.</h1>
                    <div className="mt-5 border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700" role="alert">
                        {msg}
                    </div>
                    <div className="mt-4 flex items-start gap-3 border-l-2 border-primarypurple bg-primarypurple/[0.04] px-4 py-3.5 text-sm leading-6 text-black/60">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primarypurple" aria-hidden="true" />
                        <p>
                            Verification links can expire or be used only once. A
                            fresh email will give you a new secure link.
                        </p>
                    </div>
                    <Link
                        href="/verify-email/resend"
                        className={`${AUTH_ACTION_LINK_CLASS} mt-6`}
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Resend verification email
                    </Link>
                </>
            );
        }
    } else if (mutation.isSuccess) {
        const result = mutation.data as { message?: string } | undefined;
        const successMsg =
            result?.message || "Your email has been successfully verified.";

        content = (
            <>
                <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                    <p className={AUTH_STEP_CLASS}>
                        <span className={AUTH_STEP_NUMBER_CLASS}>02</span>
                        Verification complete
                    </p>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primarygreen text-black">
                        <MailCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                </div>
                <h1 className={AUTH_TITLE_CLASS}>Your NU email is verified.</h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-black/55" role="status">
                    {successMsg} Log in to start exploring projects and connecting
                    with collaborators.
                </p>
                <Link
                    href="/login"
                    className={`${AUTH_ACTION_LINK_CLASS} mt-7`}
                >
                    Continue to login
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </>
        );
    }

    return (
        <div className={AUTH_PAGE_CLASS}>
            <div
                aria-live="polite"
                className={AUTH_STATUS_SHELL_CLASS}
            >
                {content}
            </div>
        </div>
    );
}

const VerifyEmail = () => (
    <Suspense
        fallback={
            <div className="mx-auto w-full max-w-[36rem] animate-pulse" role="status">
                <span className="sr-only">Preparing verification...</span>
                <div className="h-[22rem] border border-black/[0.06] bg-white/60 p-8">
                    <div className="h-7 w-44 bg-black/[0.06]" />
                    <div className="mt-12 h-11 w-4/5 bg-black/[0.06]" />
                    <div className="mt-5 h-5 w-2/3 bg-black/[0.06]" />
                </div>
            </div>
        }
    >
        <VerifyEmailInner />
    </Suspense>
);

export default VerifyEmail;
