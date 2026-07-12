"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
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
        <div className="mx-auto w-full space-y-6 sm:w-2/3">
            <div className="space-y-2">
                <h1 className="w-fit bg-primarygreen/20 text-left text-3xl font-black uppercase italic tracking-tight underline decoration-primarygreen underline-offset-2 sm:text-4xl">
                    Reset Password
                </h1>
                <p className="text-sm text-gray-600">
                    Enter the NU email associated with your account and
                    we&apos;ll send you a time-limited reset link.
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
                <div className="flex flex-col">
                    <label htmlFor="forgot-password-email" className="text-lg font-semibold">
                        NU Email
                    </label>
                    <input
                        id="forgot-password-email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={Boolean(errors.nuemail)}
                        aria-describedby={
                            errors.nuemail
                                ? "forgot-password-email-error"
                                : undefined
                        }
                        {...register("nuemail")}
                        className={`rounded border-2 p-2 outline-none transition-colors focus:border-primarypurple/80 ${errors.nuemail ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.nuemail && (
                        <p id="forgot-password-email-error" className="mt-1 text-sm text-red-600">
                            {errors.nuemail.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/login"
                        className="font-semibold text-primarypurple underline"
                    >
                        Back to login
                    </Link>
                    <Button
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                        className="bg-primarygreen font-bold text-black"
                    >
                        {mutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                </div>

                {mutation.isSuccess && (
                    <div
                        role="status"
                        className="rounded bg-green-100 p-3 text-sm text-green-800"
                    >
                        {responseMessage || genericSuccessMessage}
                    </div>
                )}
                {mutation.isError && (
                    <div
                        role="alert"
                        className="rounded bg-red-100 p-3 text-sm text-red-700"
                    >
                        {getAuthFormErrorMessage(
                            mutation.error,
                            "Unable to request a password reset."
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
