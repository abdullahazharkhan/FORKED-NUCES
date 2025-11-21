"use client";

import React, { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "@/lib/authClient";

type VerifyPayload = {
    token: string;
    nu_email: string;
};

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

const VerifyEmail = () => {
    const searchParams = useSearchParams();

    const token = searchParams.get("token");
    const nu_email = searchParams.get("nu_email");

    const mutation = useMutation<any, unknown, VerifyPayload>({
        mutationFn: async (payload: VerifyPayload) => {
            return await verifyEmail(payload);
        },
        onError: (err) => {
            console.error("Verify email error", err);
        },
    });

    const hasTriggered = useRef(false);

    useEffect(() => {
        if (!token || !nu_email) return;
        if (hasTriggered.current) return;

        hasTriggered.current = true;
        mutation.mutate({ token, nu_email });
    }, [token, nu_email]);

    let content: React.ReactNode = null;

    if (!token || !nu_email) {
        content = (
            <div className="mt-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                Invalid verification link. Missing token or email.
            </div>
        );
    } else if (mutation.isIdle || mutation.isPending) {
        content = (
            <>
                <div className="text-lg">
                    Verifying email for{" "}
                    <span className="font-semibold">{nu_email}</span>. Please wait...
                </div>
                <div className="w-full flex justify-center mt-6">
                    <Spinner color="secondary" />
                </div>
            </>
        );
    } else if (mutation.isError) {
        if (isAlreadyVerifiedError(mutation.error)) {
            content = (
                <>
                    <div className="text-lg text-green-700 font-semibold mb-2">
                        Your email is already verified.
                    </div>
                    <div className="mt-2 p-3 rounded bg-green-100 text-green-700 text-sm">
                        You can safely log in to your account.
                    </div>
                    <div className="mt-6">
                        <Link
                            href="/login"
                            className="text-primarypurple font-semibold underline"
                        >
                            Go to Login
                        </Link>
                    </div>
                </>
            );
        } else {
            const msg = getErrorMessage(mutation.error);

            content = (
                <>
                    <div className="text-lg text-red-700 font-semibold mb-2">
                        Email verification failed.
                    </div>
                    <div className="mt-2 p-3 rounded bg-red-100 text-red-700 text-sm">
                        {msg}
                    </div>
                    <div className="mt-4 p-3 rounded bg-yellow-100 text-yellow-800 text-sm">
                        Resend verification email to your email.
                        <div className="mt-2">
                            <Link
                                href="/resend"
                                className="text-primarypurple font-semibold underline"
                            >
                                Resend Verification Email
                            </Link>
                        </div>
                    </div>
                </>
            );
        }
    } else if (mutation.isSuccess) {
        const result = mutation.data as { message?: string } | undefined;
        const successMsg =
            result?.message || "Your email has been successfully verified.";

        content = (
            <>
                <div className="text-lg text-green-700 font-semibold mb-2">
                    Email verified successfully!
                </div>
                <div className="mt-2 p-3 rounded bg-green-100 text-green-700 text-sm">
                    {successMsg}
                </div>
                <div className="mt-6">
                    <Link
                        href="/login"
                        className="text-primarypurple font-semibold underline"
                    >
                        Go to Login
                    </Link>
                </div>
            </>
        );
    }

    return (
        <div className="sm:w-2/3 mx-auto space-y-8">
            <h1 className="text-left text-4xl font-black italic tracking-[-0.20rem] uppercase underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit">
                Verify Email
            </h1>

            {content}
        </div>
    );
};

export default VerifyEmail;
