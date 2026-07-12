"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, KeyRound, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import {
    AUTH_LABEL_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
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
        <div className="landing-fade-up">
            <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-primarypurple/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    Account recovery
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Let&apos;s get you back in.
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-black/50">
                    Enter the NU email linked to your account. We&apos;ll send a
                    secure, time-limited link to choose a new password.
                </p>
            </div>

            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-7">
                <form
                    noValidate
                    className="space-y-5"
                    onSubmit={handleSubmit((data) => mutation.mutate(data))}
                >
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
                        <p id="forgot-password-email-hint" className="text-xs leading-5 text-black/45">
                            Use the same @nu.edu.pk address you registered with.
                        </p>
                        {errors.nuemail && (
                            <p id="forgot-password-email-error" className="text-sm text-red-600">
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
                            className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm leading-6 text-green-800"
                        >
                            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{responseMessage || genericSuccessMessage}</span>
                        </div>
                    )}
                    {mutation.isError && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700"
                        >
                            {getAuthFormErrorMessage(
                                mutation.error,
                                "Unable to request a password reset."
                            )}
                        </div>
                    )}
                </form>
            </div>

            <p className="mt-6 text-center text-sm text-black/50">
                Remembered your password?{" "}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-bold text-primarypurple hover:text-black"
                >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Back to login
                </Link>
            </p>
        </div>
    );
}
