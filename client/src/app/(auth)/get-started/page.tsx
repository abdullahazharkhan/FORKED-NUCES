"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/PasswordInput";
import { registerUser } from "@/lib/authClient";
import {
    AUTH_LABEL_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
    getAuthInputClass,
} from "@/lib/authFormStyles";
import {
    MAX_PASSWORD_INPUT_LENGTH,
    newPasswordSchema,
    nuEmailSchema,
} from "@/lib/authValidation";

const getStartedSchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(1, "Full name is required")
            .max(255, "Full name must be 255 characters or fewer"),
        nuemail: nuEmailSchema,
        password: newPasswordSchema,
        confirmPassword: z
            .string()
            .min(1, "Please confirm your password")
            .max(MAX_PASSWORD_INPUT_LENGTH),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type GetStartedForm = z.infer<typeof getStartedSchema>;
type RegistrationResult = { message?: string };

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (error: unknown): string => {
    const apiError = error as ApiError | undefined;
    if (!apiError) return "Registration failed";

    if (apiError.body && typeof apiError.body === "object" && !Array.isArray(apiError.body)) {
        const body = apiError.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];
        if (firstKey && Array.isArray(body[firstKey])) return String(body[firstKey][0]);
        if (firstKey && typeof body[firstKey] === "string") return body[firstKey];
    }

    if (typeof apiError.body === "string") return apiError.body;
    if (apiError.detail) return apiError.detail;
    if (apiError.message) return apiError.message;
    if (apiError.status) return `${apiError.status} ${apiError.statusText || ""}`.trim();
    return "Registration failed";
};

const GetStarted = () => {
    const [completedRegistration, setCompletedRegistration] = useState<{
        email: string;
        result: RegistrationResult;
    } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<GetStartedForm>({
        resolver: zodResolver(getStartedSchema),
        mode: "onChange",
    });

    const mutation = useMutation<RegistrationResult, unknown, GetStartedForm>({
        mutationFn: async (data) =>
            registerUser({
                full_name: data.fullName,
                nu_email: data.nuemail,
                password: data.password,
                confirm_password: data.confirmPassword,
            }),
    });

    const onSubmit = (data: GetStartedForm) => {
        mutation.mutate(data, {
            onSuccess: (result) => {
                setCompletedRegistration({ email: data.nuemail, result });
                reset();
                mutation.reset();
            },
        });
    };

    if (completedRegistration) {
        const submittedEmail = completedRegistration.email;
        return (
            <div className="landing-fade-up rounded-3xl border border-black/[0.08] bg-white p-6 text-center shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primarygreen text-black shadow-[0_12px_35px_rgba(195,255,0,0.25)]">
                    <MailCheck className="h-8 w-8" aria-hidden="true" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primarypurple">
                    One more step
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-black">
                    Check your email.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55">
                    If <span className="font-bold text-black">{submittedEmail}</span> is
                    eligible, it will receive registration instructions. This neutral
                    response protects existing accounts from discovery.
                </p>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-primarypurple/15 bg-primarypurple/[0.04] p-4 text-left text-sm leading-6 text-black/60">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primarypurple" aria-hidden="true" />
                    <p>
                        The link expires in 24 hours. Check your spam folder or{" "}
                        <Link href="/verify-email/resend" className="font-bold text-primarypurple underline underline-offset-2">
                            resend the email
                        </Link>
                        .
                    </p>
                </div>

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

    const errorMessage = mutation.isError ? getErrorMessage(mutation.error) : null;
    const passwordDescription = errors.password
        ? "registration-password-hint registration-password-error"
        : "registration-password-hint";

    return (
        <div className="landing-fade-up">
            <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-primarypurple/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    <UserRoundPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    Join the community
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Create your builder profile.
                </h1>
                <p className="mt-3 text-sm leading-6 text-black/50">
                    Use your NU email to join a verified student collaboration space.
                </p>
            </div>

            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-7">
                <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <label htmlFor="fullName" className={AUTH_LABEL_CLASS}>Full name</label>
                        <input
                            type="text"
                            id="fullName"
                            autoComplete="name"
                            placeholder="Your full name"
                            required
                            aria-invalid={Boolean(errors.fullName)}
                            aria-describedby={errors.fullName ? "full-name-error" : undefined}
                            {...register("fullName")}
                            className={getAuthInputClass(Boolean(errors.fullName))}
                        />
                        {errors.fullName && (
                            <p id="full-name-error" className="text-sm text-red-600">{errors.fullName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="nuemail" className={AUTH_LABEL_CLASS}>NU Email</label>
                        <input
                            type="email"
                            id="nuemail"
                            autoComplete="email"
                            placeholder="k23xxxx@nu.edu.pk"
                            required
                            aria-invalid={Boolean(errors.nuemail)}
                            aria-describedby={errors.nuemail ? "registration-email-error" : undefined}
                            {...register("nuemail")}
                            className={getAuthInputClass(Boolean(errors.nuemail))}
                        />
                        {errors.nuemail && (
                            <p id="registration-email-error" className="text-sm text-red-600">{errors.nuemail.message}</p>
                        )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="password" className={AUTH_LABEL_CLASS}>Password</label>
                            <PasswordInput
                                id="password"
                                autoComplete="new-password"
                                placeholder="Create password"
                                required
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={passwordDescription}
                                {...register("password")}
                                className={getAuthInputClass(Boolean(errors.password))}
                            />
                            <p id="registration-password-hint" className="text-xs leading-5 text-black/45">
                                At least 8 characters.
                            </p>
                            {errors.password && (
                                <p id="registration-password-error" className="text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>Confirm password</label>
                            <PasswordInput
                                id="confirmPassword"
                                autoComplete="new-password"
                                placeholder="Repeat password"
                                required
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={errors.confirmPassword ? "registration-confirm-password-error" : undefined}
                                {...register("confirmPassword")}
                                className={getAuthInputClass(Boolean(errors.confirmPassword))}
                            />
                            {errors.confirmPassword && (
                                <p id="registration-confirm-password-error" className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <Button
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                    >
                        {mutation.isPending ? "Creating account..." : (
                            <span className="flex items-center gap-2">
                                Create account
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {errorMessage && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700">
                            {errorMessage}
                        </div>
                    )}
                </form>
            </div>

            <p className="mt-6 text-center text-sm text-black/50">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-primarypurple hover:text-black">
                    Log in
                </Link>
            </p>
        </div>
    );
};

export default GetStarted;
