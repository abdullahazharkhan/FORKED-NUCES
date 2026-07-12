"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    CheckCircle2,
    CircleAlert,
    KeyRound,
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
    AUTH_LABEL_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
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
            <div className="landing-fade-up text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <CircleAlert className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                    Link problem
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    This reset link is incomplete.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55" role="alert">
                    Request a fresh link and open the full URL from your email. For
                    your security, reset links may only be used once.
                </p>
                <Link
                    href="/forgot-password"
                    className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Request a fresh link
                </Link>
                <p className="mt-5 text-sm text-black/50">
                    <Link href="/login" className="font-bold text-primarypurple hover:text-black">
                        Return to login
                    </Link>
                </p>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="landing-fade-up text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primarygreen/25 text-primarypurple">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    Reset complete
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Your password is updated.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55" role="status">
                    {successMessage} You can now use it to log in to your account.
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
            <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-primarypurple/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    Secure your account
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Choose a new password.
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-black/50">
                    Make it memorable to you and difficult for anyone else to guess.
                </p>
            </div>

            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-7">
                <form noValidate className="space-y-5" onSubmit={handleSubmit(submitReset)}>
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
                        <p id="reset-new-password-hint" className="flex items-center gap-1.5 text-xs leading-5 text-black/45">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primarypurple" aria-hidden="true" />
                            Use at least 8 characters.
                        </p>
                        {errors.newPassword && (
                            <p id="reset-new-password-error" className="text-sm text-red-600">
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
                            <p id="reset-confirm-password-error" className="text-sm text-red-600">
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
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700">
                            {getAuthFormErrorMessage(
                                mutation.error,
                                "Unable to reset the password. The link may be invalid or expired."
                            )}
                            <Link
                                href="/forgot-password"
                                className="mt-2 block font-bold underline underline-offset-2"
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
                <div className="flex min-h-80 items-center justify-center gap-3" role="status">
                    <Spinner size="sm" color="secondary" />
                    <span className="text-sm text-black/50">Preparing password reset...</span>
                </div>
            }
        >
            <ResetPasswordFormContent />
        </Suspense>
    );
}
