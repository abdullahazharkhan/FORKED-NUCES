"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/PasswordInput";
import { registerUser } from "@/lib/authClient";
import {
    AUTH_ACTION_LINK_CLASS,
    AUTH_DESCRIPTION_CLASS,
    AUTH_FOOTER_CLASS,
    AUTH_FORM_SHELL_CLASS,
    AUTH_INTRO_CLASS,
    AUTH_LABEL_CLASS,
    AUTH_PAGE_CLASS,
    AUTH_PAGE_WIDE_CLASS,
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
            <div className={AUTH_PAGE_CLASS}>
                <div className={AUTH_STATUS_SHELL_CLASS} role="status">
                    <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-6">
                        <p className={AUTH_STEP_CLASS}>
                            <span className={AUTH_STEP_NUMBER_CLASS}>02</span>
                            Verify address
                        </p>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primarygreen text-black">
                            <MailCheck className="h-6 w-6" aria-hidden="true" />
                        </span>
                    </div>
                    <h1 className={AUTH_TITLE_CLASS}>
                        Check your email.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-black/55">
                        If <span className="font-semibold text-black">{submittedEmail}</span> is
                        eligible, it will receive registration instructions. This neutral
                        response protects existing accounts from discovery.
                    </p>

                    <div className="mt-6 flex items-start gap-3 border-l-2 border-primarypurple bg-primarypurple/[0.04] px-4 py-3.5 text-sm leading-6 text-black/60">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primarypurple" aria-hidden="true" />
                        <p>
                            The link expires in 24 hours. Check your spam folder or{" "}
                            <Link href="/verify-email/resend" className={AUTH_TEXT_LINK_CLASS}>
                                resend the email
                            </Link>
                            .
                        </p>
                    </div>

                    <Link href="/login" className={`${AUTH_ACTION_LINK_CLASS} mt-7`}>
                        Continue to login
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        );
    }

    const errorMessage = mutation.isError ? getErrorMessage(mutation.error) : null;
    const passwordDescription = errors.password
        ? "registration-password-hint registration-password-error"
        : "registration-password-hint";

    return (
        <div className={AUTH_PAGE_WIDE_CLASS}>
            <div className={AUTH_INTRO_CLASS}>
                <p className={AUTH_STEP_CLASS}>
                    <span className={AUTH_STEP_NUMBER_CLASS}>01</span>
                    Account setup
                </p>
                <h1 className={AUTH_TITLE_CLASS}>
                    Create your builder profile.
                </h1>
                <p className={AUTH_DESCRIPTION_CLASS}>
                    Use your NU email to join a verified student collaboration space.
                </p>
            </div>

            <div className={AUTH_FORM_SHELL_CLASS}>
                <form noValidate className="space-y-7" onSubmit={handleSubmit(onSubmit)}>
                    <fieldset className="space-y-5">
                        <legend className="mb-5 flex w-full items-center gap-3 border-b border-black/10 pb-4 font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            <span className="text-primarypurple">A</span>
                            Identity
                        </legend>
                        <div className="grid gap-5 sm:grid-cols-2">
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
                                    <p id="full-name-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.fullName.message}</p>
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
                                    <p id="registration-email-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.nuemail.message}</p>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="space-y-5">
                        <legend className="mb-5 flex w-full items-center gap-3 border-b border-black/10 pb-4 font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            <span className="text-primarypurple">B</span>
                            Access key
                        </legend>
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
                                <p id="registration-password-hint" className="text-xs leading-5 text-black/60">
                                    At least 8 characters.
                                </p>
                                {errors.password && (
                                    <p id="registration-password-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.password.message}</p>
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
                                    <p id="registration-confirm-password-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <p className="border-t border-black/10 pt-5 text-xs leading-5 text-black/60">
                        By creating an account, you agree to the{" "}
                        <Link href="/terms" className={AUTH_TEXT_LINK_CLASS}>terms of use</Link>
                        {" "}and acknowledge the{" "}
                        <Link href="/privacy" className={AUTH_TEXT_LINK_CLASS}>privacy notice</Link>.
                    </p>

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
                        <div role="alert" className="border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700">
                            {errorMessage}
                        </div>
                    )}
                </form>
            </div>

            <p className={AUTH_FOOTER_CLASS}>
                Already have an account?{" "}
                <Link href="/login" className={AUTH_TEXT_LINK_CLASS}>
                    Log in
                </Link>
            </p>
        </div>
    );
};

export default GetStarted;
