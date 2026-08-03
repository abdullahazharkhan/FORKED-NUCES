"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    CheckCircle2,
    CircleAlert,
    RotateCcw,
    ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import {
    AUTH_ACTION_LINK_CLASS,
    AUTH_DESCRIPTION_CLASS,
    AUTH_ERROR_STEP_CLASS,
    AUTH_ERROR_STEP_NUMBER_CLASS,
    AUTH_FORM_SHELL_CLASS,
    AUTH_INTRO_CLASS,
    AUTH_LABEL_CLASS,
    AUTH_PAGE_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
    AUTH_STATUS_SHELL_CLASS,
    AUTH_STEP_CLASS,
    AUTH_STEP_NUMBER_CLASS,
    AUTH_TEXT_LINK_CLASS,
    AUTH_TITLE_CLASS,
    getAuthInputClass,
} from "@/lib/authFormStyles";
import {
    MAX_PASSWORD_INPUT_LENGTH,
    newPasswordSchema,
} from "@/lib/authValidation";
import { useAuthStore } from "@/stores";
import { PasswordInput } from "@/components/PasswordInput";

const resetPasswordSchema = z
    .object({
        newPassword: newPasswordSchema,
        confirmPassword: z
            .string()
            .min(1, "Please confirm your new password")
            .max(MAX_PASSWORD_INPUT_LENGTH),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type ResetPasswordResponse = { detail?: string; message?: string };

function ResetPasswordFormContent() {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const clearUser = useAuthStore((state) => state.clearUser);
    const uid = searchParams.get("uid")?.trim() ?? "";
    const token = searchParams.get("token")?.trim() ?? "";
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    });

    const mutation = useMutation({
        mutationFn: async (data: ResetPasswordForm) => {
            const response = await fetch("/api/auth/password-reset/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid,
                    token,
                    new_password: data.newPassword,
                    confirm_password: data.confirmPassword,
                }),
            });
            return readAuthResponse<ResetPasswordResponse>(
                response,
                "Unable to reset the password."
            );
        },
    });

    const submitReset = (data: ResetPasswordForm) => {
        setSuccessMessage(null);
        mutation.mutate(data, {
            onSuccess: (result) => {
                setSuccessMessage(
                    result?.message ??
                    result?.detail ??
                    "Your password has been reset successfully."
                );
                reset();
                mutation.reset();
                queryClient.clear();
                clearUser();
            },
        });
    };

    if (!uid || !token) {
        return (
            <div className={AUTH_PAGE_CLASS}>
                <div className={AUTH_STATUS_SHELL_CLASS}>
                    <div className="flex items-start justify-between gap-5 rounded-2xl border border-red-100/80 bg-gradient-to-r from-red-50/80 via-white to-red-50/40 p-4">
                        <p className={AUTH_ERROR_STEP_CLASS}>
                            <span className={AUTH_ERROR_STEP_NUMBER_CLASS}>ERR</span>
                            Link problem
                        </p>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-[0_8px_22px_rgba(185,28,28,0.08)] ring-1 ring-inset ring-red-100">
                            <CircleAlert className="h-6 w-6" aria-hidden="true" />
                        </span>
                    </div>
                    <h1 className={AUTH_TITLE_CLASS}>This reset link is incomplete.</h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-black/55" role="alert">
                        Request a fresh link and open the full URL from your email. For
                        your security, reset links may only be used once.
                    </p>
                    <Link href="/forgot-password" className={`${AUTH_ACTION_LINK_CLASS} mt-7`}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Request a fresh link
                    </Link>
                    <p className="mt-5 rounded-2xl bg-black/[0.025] p-4 text-center text-sm text-black/60">
                        <Link href="/login" className={AUTH_TEXT_LINK_CLASS}>
                            Return to login
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className={AUTH_PAGE_CLASS}>
                <div className={AUTH_STATUS_SHELL_CLASS}>
                    <div className="flex items-start justify-between gap-5 rounded-2xl border border-black/[0.05] bg-gradient-to-r from-primarypurple/[0.045] via-white to-primarygreen/[0.04] p-4">
                        <p className={AUTH_STEP_CLASS}>
                            <span className={AUTH_STEP_NUMBER_CLASS}>02</span>
                            Reset complete
                        </p>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primarygreen to-[#dfff83] text-black shadow-[0_9px_24px_rgba(183,255,0,0.2)]">
                            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                        </span>
                    </div>
                    <h1 className={AUTH_TITLE_CLASS}>Your password is updated.</h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-black/55" role="status">
                        {successMessage} You can now use it to log in to your account.
                    </p>
                    <Link href="/login" className={`${AUTH_ACTION_LINK_CLASS} mt-7`}>
                        Continue to login
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={AUTH_PAGE_CLASS}>
            <div className={AUTH_INTRO_CLASS}>
                <p className={AUTH_STEP_CLASS}>
                    <span className={AUTH_STEP_NUMBER_CLASS}>02</span>
                    Set new credentials
                </p>
                <h1 className={AUTH_TITLE_CLASS}>
                    Choose a new password.
                </h1>
                <p className={AUTH_DESCRIPTION_CLASS}>
                    Make it memorable to you and difficult for anyone else to guess.
                </p>
            </div>

            <div className={AUTH_FORM_SHELL_CLASS}>
                <form noValidate className="space-y-6" onSubmit={handleSubmit(submitReset)}>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.05] bg-gradient-to-r from-primarypurple/[0.045] via-white to-primarygreen/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <p className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            New access key
                        </p>
                        <span className="text-xs text-black/60">Step 2 of 2</span>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="reset-new-password" className={AUTH_LABEL_CLASS}>
                            New password
                        </label>
                        <PasswordInput
                            id="reset-new-password"
                            autoComplete="new-password"
                            placeholder="Create a new password"
                            required
                            aria-invalid={Boolean(errors.newPassword)}
                            aria-describedby={
                                errors.newPassword
                                    ? "reset-new-password-hint reset-new-password-error"
                                    : "reset-new-password-hint"
                            }
                            {...register("newPassword")}
                            className={getAuthInputClass(Boolean(errors.newPassword))}
                        />
                        <p id="reset-new-password-hint" className="flex items-center gap-1.5 text-xs leading-5 text-black/60">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primarypurple" aria-hidden="true" />
                            Use at least 8 characters.
                        </p>
                        {errors.newPassword && (
                            <p id="reset-new-password-error" className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-700">
                                {errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="reset-confirm-password" className={AUTH_LABEL_CLASS}>
                            Confirm new password
                        </label>
                        <PasswordInput
                            id="reset-confirm-password"
                            autoComplete="new-password"
                            placeholder="Repeat your new password"
                            required
                            aria-invalid={Boolean(errors.confirmPassword)}
                            aria-describedby={
                                errors.confirmPassword
                                    ? "reset-confirm-password-error"
                                    : undefined
                            }
                            {...register("confirmPassword")}
                            className={getAuthInputClass(Boolean(errors.confirmPassword))}
                        />
                        {errors.confirmPassword && (
                            <p id="reset-confirm-password-error" className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-700">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                    >
                        {mutation.isPending ? "Updating password..." : (
                            <span className="flex items-center gap-2">
                                Update password
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {mutation.isError && (
                        <div role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-sm leading-6 text-red-700 shadow-[0_8px_22px_rgba(185,28,28,0.05)]">
                            {getAuthFormErrorMessage(
                                mutation.error,
                                "Unable to reset the password. The link may be invalid or expired."
                            )}
                            <Link
                                href="/forgot-password"
                                className="mt-2 block font-semibold underline underline-offset-4"
                            >
                                Request a new reset link
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto w-full max-w-[36rem] animate-pulse" role="status">
                    <span className="sr-only">Preparing password reset...</span>
                    <div className="h-7 w-48 rounded-xl bg-black/[0.06]" />
                    <div className="mt-5 h-11 w-4/5 rounded-xl bg-black/[0.06]" />
                    <div className="mt-4 h-5 w-2/3 rounded-xl bg-black/[0.06]" />
                    <div className="mt-8 h-80 rounded-3xl border border-black/[0.05] bg-gradient-to-br from-white/80 to-primarypurple/[0.035] shadow-[0_16px_45px_rgba(24,15,48,0.05)]" />
                </div>
            }
        >
            <ResetPasswordFormContent />
        </Suspense>
    );
}
