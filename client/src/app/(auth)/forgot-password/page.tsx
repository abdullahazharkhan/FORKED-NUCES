"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
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
import { nuEmailSchema } from "@/lib/authValidation";

const forgotPasswordSchema = z.object({
    nuemail: nuEmailSchema,
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetRequestResponse = { detail?: string; message?: string };

const genericSuccessMessage =
    "A password-reset link has been sent to your NU email.";

export default function ForgotPassword() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onChange",
    });

    const mutation = useMutation({
        mutationFn: async (data: ForgotPasswordForm) => {
            const response = await fetch("/api/auth/password-reset/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nu_email: data.nuemail }),
            });
            return readAuthResponse<ResetRequestResponse>(
                response,
                "Unable to request a password reset."
            );
        },
        onSuccess: () => reset(),
    });

    const responseMessage = mutation.data?.message ?? mutation.data?.detail;

    return (
        <div className={AUTH_PAGE_CLASS}>
            <div className={AUTH_INTRO_CLASS}>
                <p className={AUTH_STEP_CLASS}>
                    <span className={AUTH_STEP_NUMBER_CLASS}>01</span>
                    Recovery request
                </p>
                <h1 className={AUTH_TITLE_CLASS}>
                    Let&apos;s get you back in.
                </h1>
                <p className={AUTH_DESCRIPTION_CLASS}>
                    Enter the NU email linked to your account. We&apos;ll send a
                    secure, time-limited link to choose a new password.
                </p>
            </div>

            <div className={AUTH_FORM_SHELL_CLASS}>
                <form
                    noValidate
                    className="space-y-6"
                    onSubmit={handleSubmit((data) => mutation.mutate(data))}
                >
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-gradient-to-r from-primarypurple/[0.045] via-white to-primarygreen/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <p className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            Identify account
                        </p>
                        <span className="text-xs text-black/60">Step 1 of 2</span>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="forgot-password-email" className={AUTH_LABEL_CLASS}>
                            NU Email
                        </label>
                        <input
                            id="forgot-password-email"
                            type="email"
                            autoComplete="email"
                            placeholder="k23xxxx@nu.edu.pk"
                            required
                            aria-invalid={Boolean(errors.nuemail)}
                            aria-describedby={
                                errors.nuemail
                                    ? "forgot-password-email-hint forgot-password-email-error"
                                    : "forgot-password-email-hint"
                            }
                            {...register("nuemail")}
                            className={getAuthInputClass(Boolean(errors.nuemail))}
                        />
                        <p id="forgot-password-email-hint" className="text-xs leading-5 text-black/60">
                            Use the same @nu.edu.pk address you registered with.
                        </p>
                        {errors.nuemail && (
                            <p id="forgot-password-email-error" className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-700">
                                {errors.nuemail.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                    >
                        {mutation.isPending ? "Sending secure link..." : (
                            <span className="flex items-center gap-2">
                                Send reset link
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {mutation.isSuccess && (
                        <div
                            role="status"
                            className="flex gap-3 rounded-2xl border border-green-200/80 bg-green-50/80 p-4 text-sm leading-6 text-green-800 shadow-[0_8px_22px_rgba(22,101,52,0.06)]"
                        >
                            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{responseMessage || genericSuccessMessage}</span>
                        </div>
                    )}
                    {mutation.isError && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-sm leading-6 text-red-700 shadow-[0_8px_22px_rgba(185,28,28,0.05)]"
                        >
                            {getAuthFormErrorMessage(
                                mutation.error,
                                "Unable to request a password reset."
                            )}
                        </div>
                    )}
                </form>
            </div>

            <p className={AUTH_FOOTER_CLASS}>
                Remembered your password?{" "}
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
