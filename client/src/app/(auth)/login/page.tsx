"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/PasswordInput";
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
import { MAX_PASSWORD_INPUT_LENGTH, nuEmailSchema } from "@/lib/authValidation";
import { getSafeInternalPath } from "@/lib/safeRedirect";
import { useAuthStore } from "@/stores";

const loginSchema = z.object({
    nuemail: nuEmailSchema,
    password: z
        .string()
        .min(1, "Password is required")
        .max(
            MAX_PASSWORD_INPUT_LENGTH,
            `Password must be ${MAX_PASSWORD_INPUT_LENGTH} characters or fewer`
        ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (error: unknown): string => {
    const apiError = error as ApiError | undefined;
    if (!apiError) return "Login failed";

    if (apiError.body && typeof apiError.body === "object" && !Array.isArray(apiError.body)) {
        const body = apiError.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];
        if (firstKey) {
            const value = body[firstKey];
            if (Array.isArray(value) && value.length > 0) return String(value[0]);
            if (typeof value === "string") return value;
        }
    }

    if (typeof apiError.body === "string") return apiError.body;
    if (apiError.detail) return apiError.detail;
    if (apiError.message) return apiError.message;
    if (apiError.status) return `${apiError.status} ${apiError.statusText || ""}`.trim();
    return "Login failed";
};

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const setUser = useAuthStore((state) => state.setUser);
    const reason = searchParams.get("reason");
    const securityNotice =
        reason === "password-changed"
            ? "Your password was changed. Sign in again with your new password."
            : reason === "logout-all"
                ? "All sessions were signed out successfully."
                : reason === "account-deleted"
                    ? "Your account and personal profile data were deleted successfully."
                    : null;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginFormValues) => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nu_email: data.nuemail,
                    password: data.password,
                }),
            });
            const body = await response.json().catch(() => null);
            if (!response.ok) {
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    body,
                } as ApiError;
            }
            return body;
        },
        onSuccess: (data) => {
            queryClient.clear();
            setUser(data.user);
            router.replace(getSafeInternalPath(searchParams.get("next")));
        },
    });

    let message: ReactNode | null = null;
    let isError = false;
    if (loginMutation.isError) {
        const rawMessage = getErrorMessage(loginMutation.error);
        message =
            rawMessage === "Email is not verified." ? (
                <span>
                    Your email is not verified.{" "}
                    <Link href="/verify-email/resend" className="font-bold underline underline-offset-2">
                        Resend verification email
                    </Link>
                </span>
            ) : (
                rawMessage
            );
        isError = true;
    }

    return (
        <div className={AUTH_PAGE_CLASS}>
            <div className={AUTH_INTRO_CLASS}>
                <p className={AUTH_STEP_CLASS}>
                    <span className={AUTH_STEP_NUMBER_CLASS}>01</span>
                    Account access
                </p>
                <h1 className={AUTH_TITLE_CLASS}>
                    Log in to keep building.
                </h1>
                <p className={AUTH_DESCRIPTION_CLASS}>
                    Access your projects, collaborations, and community activity.
                </p>
            </div>

            {securityNotice && (
                <div role="status" className="mb-4 flex gap-3 border border-green-200 bg-green-50 p-3.5 text-sm leading-6 text-green-800">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {securityNotice}
                </div>
            )}

            <div className={AUTH_FORM_SHELL_CLASS}>
                <form noValidate className="space-y-6" onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
                    <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
                        <p className="font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-black/60">
                            NU credentials
                        </p>
                        <span className="flex items-center gap-2 text-xs text-black/60">
                            <span className="h-2 w-2 bg-primarygreen ring-1 ring-black/10" aria-hidden="true" />
                            Secure sign-in
                        </span>
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
                            aria-describedby={errors.nuemail ? "login-email-error" : undefined}
                            {...register("nuemail")}
                            className={getAuthInputClass(Boolean(errors.nuemail))}
                        />
                        {errors.nuemail && (
                            <p id="login-email-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.nuemail.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <label htmlFor="password" className={AUTH_LABEL_CLASS}>Password</label>
                            <Link href="/forgot-password" className={`${AUTH_TEXT_LINK_CLASS} text-xs`}>
                                Forgot password?
                            </Link>
                        </div>
                        <PasswordInput
                            id="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            required
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? "login-password-error" : undefined}
                            {...register("password")}
                            className={getAuthInputClass(Boolean(errors.password))}
                        />
                        {errors.password && (
                            <p id="login-password-error" className="border-l-2 border-red-500 pl-2.5 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                        type="submit"
                        isDisabled={!isValid || loginMutation.isPending}
                    >
                        {loginMutation.isPending ? "Logging in..." : (
                            <span className="flex items-center gap-2">
                                Log in
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {message && (
                        <div
                            role={isError ? "alert" : "status"}
                            className={`border p-3.5 text-sm leading-6 ${
                                isError
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-green-200 bg-green-50 text-green-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}
                </form>
            </div>

            <p className={AUTH_FOOTER_CLASS}>
                New to FORKED NUCES?{" "}
                <Link href="/get-started" className={AUTH_TEXT_LINK_CLASS}>
                    Create an account
                </Link>
            </p>
        </div>
    );
};

const Login = () => (
    <Suspense
        fallback={
            <div className="mx-auto w-full max-w-[36rem] animate-pulse" role="status">
                <span className="sr-only">Loading login...</span>
                <div className="h-7 w-40 bg-black/[0.06]" />
                <div className="mt-5 h-11 w-4/5 bg-black/[0.06]" />
                <div className="mt-4 h-5 w-3/5 bg-black/[0.06]" />
                <div className="mt-8 h-72 border border-black/[0.06] bg-white/60" />
            </div>
        }
    >
        <LoginForm />
    </Suspense>
);

export default Login;
