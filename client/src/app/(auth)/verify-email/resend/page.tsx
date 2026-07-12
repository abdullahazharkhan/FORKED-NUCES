"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MailCheck, MailPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resendVerificationEmail } from "@/lib/authClient";
import {
    AUTH_LABEL_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
    getAuthInputClass,
} from "@/lib/authFormStyles";

const resendEmailSchema = z.object({
    nuemail: z
        .string()
        .email("Please enter a valid email address")
        .refine(
            (value) => value.trim().toLowerCase().endsWith("@nu.edu.pk"),
            "Only @nu.edu.pk email addresses are allowed"
        ),
});

type ResendEmailForm = z.infer<typeof resendEmailSchema>;

type ResendEmailResult = {
    message?: string;
};

type ApiError = {
    body?: unknown;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;

    if (!e) return "Unable to resend the verification email.";

    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const body = e.body as Record<string, unknown>;
        const firstKey = Object.keys(body)[0];
        if (firstKey && Array.isArray(body[firstKey])) {
            return String(body[firstKey][0]);
        }
        if (firstKey && typeof body[firstKey] === "string") {
            return body[firstKey];
        }
    }

    if (typeof e.body === "string") return e.body;

    if (e.detail) return e.detail;
    if (e.message) return e.message;

    if (e.status) {
        return `${e.status} ${e.statusText || ""}`.trim();
    }

    return "Unable to resend the verification email.";
};

export default function ResendEmail() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ResendEmailForm>({
        resolver: zodResolver(resendEmailSchema),
        mode: "onChange",
    });

    const mutation = useMutation<ResendEmailResult, unknown, ResendEmailForm>({
        mutationFn: async (data: ResendEmailForm) => {
            const payload = {
                nu_email: data.nuemail,
            };
            return await resendVerificationEmail(payload);
        },
        onSuccess: () => {
            reset();
        },
    });

    const onSubmit = (data: ResendEmailForm) => {
        mutation.mutate(data);
    };

    const message = mutation.isError
        ? getErrorMessage(mutation.error)
        : mutation.isSuccess
            ? mutation.data?.message || "If an unverified account exists, check its inbox."
            : null;

    return (
        <div className="landing-fade-up">
            <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-primarypurple/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                    <MailPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    Email verification
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">
                    Send a fresh verification link.
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-black/50">
                    Didn&apos;t receive your first email or has the link expired? We&apos;ll
                    send another secure link to your NU inbox.
                </p>
            </div>

            <div className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_70px_rgba(31,21,67,0.08)] sm:p-7">
                <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <label htmlFor="nuemail" className={AUTH_LABEL_CLASS}>
                            NU Email
                        </label>
                        <input
                            type="email"
                            id="nuemail"
                            autoComplete="email"
                            placeholder="k23xxxx@nu.edu.pk"
                            required
                            aria-invalid={Boolean(errors.nuemail)}
                            aria-describedby={
                                errors.nuemail
                                    ? "resend-email-hint resend-email-error"
                                    : "resend-email-hint"
                            }
                            {...register("nuemail")}
                            className={getAuthInputClass(Boolean(errors.nuemail))}
                        />
                        <p id="resend-email-hint" className="text-xs leading-5 text-black/45">
                            Use the @nu.edu.pk address from your registration.
                        </p>
                        {errors.nuemail && (
                            <p id="resend-email-error" className="text-sm text-red-600">
                                {errors.nuemail.message}
                            </p>
                        )}
                    </div>

                    <Button
                        className={AUTH_PRIMARY_BUTTON_CLASS}
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                    >
                        {mutation.isPending ? "Sending verification email..." : (
                            <span className="flex items-center gap-2">
                                Send verification email
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                    </Button>

                    {message && (
                        <div
                            role={mutation.isError ? "alert" : "status"}
                            className={`flex gap-3 rounded-xl border p-3.5 text-sm leading-6 ${mutation.isError
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-800"
                            }`}
                        >
                            {!mutation.isError && (
                                <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>{message}</span>
                        </div>
                    )}
                </form>
            </div>

            <p className="mt-6 text-center text-sm text-black/50">
                Already verified?{" "}
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
