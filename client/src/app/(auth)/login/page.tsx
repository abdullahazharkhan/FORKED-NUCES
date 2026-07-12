"use client";

import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useAuthStore } from "@/stores";
import {
    MAX_PASSWORD_INPUT_LENGTH,
    nuEmailSchema,
} from "@/lib/authValidation";
import { getSafeInternalPath } from "@/lib/safeRedirect";

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

type LoginForm = z.infer<typeof loginSchema>;

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;

    if (!e) return "Login failed";

    // DRF-style body object
    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const body = e.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];

        if (firstKey) {
            const value = body[firstKey];
            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }
            if (typeof value === "string") {
                return value;
            }
        }
    }

    if (typeof e.body === "string") return e.body;
    if (e.detail) return e.detail;
    if (e.message) return e.message;

    if (e.status) {
        return `${e.status} ${e.statusText || ""}`.trim();
    }

    return "Login failed";
};

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const authStore = useAuthStore.getState();
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
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginForm) => {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nu_email: data.nuemail,
                    password: data.password,
                }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok) {
                throw {
                    status: res.status,
                    statusText: res.statusText,
                    body,
                } as ApiError;
            }

            return body;
        },
        onSuccess: (data) => {
            queryClient.clear();
            authStore.setUser(data.user);
            const nextPath = getSafeInternalPath(searchParams.get("next"));
            router.replace(nextPath);
        },
    });

    const onSubmit = (data: LoginForm) => {
        loginMutation.mutate(data);
    };

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

    let message: React.ReactNode | string | null = null;
    let isError = false;

    if (loginMutation.isError) {
        const rawMessage = getErrorMessage(loginMutation.error);

        if (rawMessage === "Email is not verified.") {
            message = (
                <span>
                    Your email is not verified.{" "}
                    <Link
                        href="/verify-email/resend"
                        className="text-primarypurple font-semibold underline"
                    >
                        Resend verification email
                    </Link>
                </span>
            );
        } else {
            message = rawMessage;
        }

        isError = true;
    } else if (loginMutation.isSuccess) {
        const result = loginMutation.data as { message?: string } | undefined;
        message = result?.message || "Login successful.";
        isError = false;
    }

    return (
        <div className="sm:w-2/3 mx-auto space-y-8">
            <h1 className="text-left text-4xl font-black italic tracking-[-0.20rem] uppercase underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit">
                Login
            </h1>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* NU Email */}
                <div className="flex flex-col">
                    <label htmlFor="nuemail" className="font-semibold text-lg">
                        NU Email
                    </label>
                    <input
                        type="email"
                        id="nuemail"
                        autoComplete="email"
                        aria-invalid={Boolean(errors.nuemail)}
                        aria-describedby={
                            errors.nuemail ? "login-email-error" : undefined
                        }
                        {...register("nuemail")}
                        className={getInputClass(errors.nuemail)}
                    />
                    {errors.nuemail && (
                        <p id="login-email-error" className="text-sm text-red-500 mt-1">
                            {errors.nuemail.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="flex flex-col">
                    <label htmlFor="password" className="font-semibold text-lg">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                            errors.password ? "login-password-error" : undefined
                        }
                        {...register("password")}
                        className={getInputClass(errors.password)}
                    />
                    {errors.password && (
                        <p id="login-password-error" className="text-sm text-red-500 mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span>
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/get-started"
                            className="text-primarypurple font-semibold underline"
                        >
                            Get Started
                        </Link>
                    </span>
                    <Link
                        href="/forgot-password"
                        className="font-semibold text-primarypurple underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || loginMutation.isPending}
                    >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                </div>

                {securityNotice && (
                    <div
                        role="status"
                        className="mt-4 rounded bg-green-100 p-3 text-sm text-green-800"
                    >
                        {securityNotice}
                    </div>
                )}

                {message && (
                    <div
                        role={isError ? "alert" : "status"}
                        className={`mt-4 p-3 rounded text-sm ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}
                    >
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

const Login = () => (
    <React.Suspense
        fallback={
            <div className="flex items-center justify-center gap-3" role="status">
                <Spinner size="sm" />
                <span>Loading login...</span>
            </div>
        }
    >
        <LoginForm />
    </React.Suspense>
);

export default Login;
