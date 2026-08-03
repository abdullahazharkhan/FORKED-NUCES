"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resendVerificationEmail } from "@/lib/authClient";
import {
    AUTH_DESCRIPTION_CLASS,
    AUTH_FOOTER_CLASS,
    AUTH_FORM_SHELL_CLASS,
    AUTH_INTRO_CLASS,
    AUTH_LABEL_CLASS,
    AUTH_PAGE_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
    AUTH_STEP_CLASS,
    AUTH_STEP_NUMBER_CLASS,
    AUTH_TEXT_LINK_CLASS,
    AUTH_TITLE_CLASS,
    getAuthInputClass,
} from "@/lib/authFormStyles";

const resendEmailSchema = z.object({
    nuemail: z
        .string()
        .email("Please enter a valid email address")
        .refine(
            (value) => value.trim().toLowerCase().endsWith("@nu.edu.pk"),
            "Only @nu.edu.pk email addresses are allowed"
        ),
});

type ResendEmailForm = z.infer<typeof resendEmailSchema>;

type ResendEmailResult = {
    message?: string;
};

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;

    if (!e) return "Unable to resend the verification email.";

    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const body = e.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];
        if (firstKey && Array.isArray(body[firstKey])) {
            return String(body[firstKey][0]);
        }
        if (firstKey && typeof body[firstKey] === "string") {
            return body[firstKey];
        }
    }

    if (typeof e.body === "string") return e.body;

    if (e.detail) return e.detail;
    if (e.message) return e.message;

    if (e.status) {
        return `${e.status} ${e.statusText || ""}`.trim();
    }

    return "Unable to resend the verification email.";
};

export default function ResendEmail() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ResendEmailForm>({
        resolver: zodResolver(resendEmailSchema),
        mode: "onChange",
    });

    const mutation = useMutation<ResendEmailResult, unknown, ResendEmailForm>({
        mutationFn: async (data: ResendEmailForm) => {
            const payload = {
                nu_email: data.nuemail,
            };
            return await resendVerificationEmail(payload);
        },
        onSuccess: () => {
            reset();
        },
    });

    const onSubmit = (data: ResendEmailForm) => {
        mutation.mutate(data);
    };

    const message = mutation.isError
        ? getErrorMessage(mutation.error)
        : mutation.isSuccess
            ? mutation.data?.message || "If an unverified account exists, check its inbox."
            : null;

    return (
        <div className={AUTH_PAGE_CLASS}>
            <div className={AUTH_INTRO_CLASS}>
                <p className={AUTH_STEP_CLASS}>
                    <span className={AUTH_STEP_NUMBER_CLASS}>01</span>
                    Verification request
                </p>
                <h1 className={AUTH_TITLE_CLASS}>
                    Send a fresh verification link.
                </h1>
                <p className={AUTH_DESCRIPTION_CLASS}>
                    Didn&apos;t receive your first email or has the link expired? We&apos;ll
                    send another secure link to your NU inbox.
                </p>
            </div>

            <div className={AUTH_FORM_SHELL_CLASS}>
                <form noValidate className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-gradient-to-r from-primarypurple/[0.045] via-white to-primarygreen/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <p className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            NU address
                        </p>
                        <span className="text-xs text-black/60">New link</span>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="nuemail" className={AUTH_LABEL_CLASS}>
                            NU Email
                        </label>
                        <input
                            type="email"
                            id="nuemail"
                            autoComplete="email"
                            placeholder="k23xxxx@nu.edu.pk"
                            required
                            aria-invalid={Boolean(errors.nuemail)}
                            aria-describedby={
                                errors.nuemail
                                    ? "resend-email-hint resend-email-error"
                                    : "resend-email-hint"
                            }
                            {...register("nuemail")}
                            className={getAuthInputClass(Boolean(errors.nuemail))}
                        />
                        <p id="resend-email-hint" className="text-xs leading-5 text-black/60">
                            Use the @nu.edu.pk address from your registration.
                        </p>
                        {errors.nuemail && (
                            <p id="resend-email-error" className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-700">
                                {errors.nuemail.message}
                            </p>
                        )}
                    </div>

                    <Button
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                    >
                        {mutation.isPending ? "Sending verification email..." : (
                            <span className="flex items-center gap-2">
                                Send verification email
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {message && (
                        <div
                            role={mutation.isError ? "alert" : "status"}
                            className={`flex gap-3 rounded-2xl border p-4 text-sm leading-6 shadow-[0_8px_22px_rgba(24,15,48,0.05)] ${mutation.isError
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-800"
                            }`}
                        >
                            {!mutation.isError && (
                                <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>{message}</span>
                        </div>
                    )}
                </form>
            </div>

            <p className={AUTH_FOOTER_CLASS}>
                Already verified?{" "}
                <Link
                    href="/login"
                    className={`${AUTH_TEXT_LINK_CLASS} inline-flex items-center gap-1`}
                >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Back to login
                </Link>
            </p>
        </div>
    );
}
