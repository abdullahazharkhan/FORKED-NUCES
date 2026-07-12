"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import {
    MAX_PASSWORD_INPUT_LENGTH,
    newPasswordSchema,
} from "@/lib/authValidation";
import { useAuthStore } from "@/stores";

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
            <div className="mx-auto w-full space-y-4 sm:w-2/3">
                <h1 className="text-3xl font-black uppercase text-primarypurple">
                    Invalid Reset Link
                </h1>
                <p className="rounded bg-red-100 p-3 text-sm text-red-700" role="alert">
                    This password-reset link is incomplete. Request a new link and
                    use the full URL from your email.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-block font-semibold text-primarypurple underline"
                >
                    Request a new reset link
                </Link>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="mx-auto w-full space-y-5 sm:w-2/3">
                <h1 className="text-3xl font-black uppercase text-primarypurple">
                    Password Updated
                </h1>
                <p className="rounded bg-green-100 p-3 text-sm text-green-800" role="status">
                    {successMessage}
                </p>
                <Link
                    href="/login"
                    className="inline-block rounded bg-primarygreen px-5 py-2 font-bold text-black"
                >
                    Continue to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full space-y-6 sm:w-2/3">
            <div className="space-y-2">
                <h1 className="w-fit bg-primarygreen/20 text-3xl font-black uppercase italic tracking-tight underline decoration-primarygreen sm:text-4xl">
                    Choose a New Password
                </h1>
                <p className="text-sm text-gray-600">
                    Use at least eight characters. Additional password-safety rules
                    may apply.
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(submitReset)}>
                <div className="flex flex-col">
                    <label htmlFor="reset-new-password" className="text-lg font-semibold">
                        New Password
                    </label>
                    <input
                        id="reset-new-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.newPassword)}
                        aria-describedby={
                            errors.newPassword
                                ? "reset-new-password-error"
                                : undefined
                        }
                        {...register("newPassword")}
                        className={`rounded border-2 p-2 outline-none transition-colors focus:border-primarypurple/80 ${errors.newPassword ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.newPassword && (
                        <p id="reset-new-password-error" className="mt-1 text-sm text-red-600">
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col">
                    <label htmlFor="reset-confirm-password" className="text-lg font-semibold">
                        Confirm New Password
                    </label>
                    <input
                        id="reset-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={
                            errors.confirmPassword
                                ? "reset-confirm-password-error"
                                : undefined
                        }
                        {...register("confirmPassword")}
                        className={`rounded border-2 p-2 outline-none transition-colors focus:border-primarypurple/80 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.confirmPassword && (
                        <p id="reset-confirm-password-error" className="mt-1 text-sm text-red-600">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                        className="bg-primarygreen font-bold text-black"
                    >
                        {mutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                </div>

                {mutation.isError && (
                    <div role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
                        {getAuthFormErrorMessage(
                            mutation.error,
                            "Unable to reset the password. The link may be invalid or expired."
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center gap-3" role="status">
                    <Spinner size="sm" />
                    <span>Loading password reset...</span>
                </div>
            }
        >
            <ResetPasswordFormContent />
        </Suspense>
    );
}
