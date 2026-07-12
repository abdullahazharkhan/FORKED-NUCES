"use client";

import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { resendVerificationEmail } from "@/lib/authClient";

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

    if (!e) return "Registration failed";

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

    return "Registration failed";
};

const ResendEmail = () => {
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


    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

    return (
        <div className=" sm:w-2/3 mx-auto space-y-8">
            <h1 className="text-left text-4xl font-black italic tracking-[-0.20rem] uppercase underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit">
                RESEND VERIFICATION EMAIL
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
                            errors.nuemail ? "resend-email-error" : undefined
                        }
                        {...register("nuemail")}
                        className={getInputClass(errors.nuemail)}
                    />
                    {errors.nuemail && (
                        <p id="resend-email-error" className="text-sm text-red-500 mt-1">
                            {errors.nuemail.message}
                        </p>
                    )}
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || mutation.isPending}
                    >
                        {mutation.isPending ? "Sending..." : "Resend Verification Email"}
                    </Button>
                </div>

                {message && (
                    <div
                        role={mutation.isError ? "alert" : "status"}
                        className={`mt-4 p-3 rounded text-sm ${mutation.isError
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                            }`}
                    >
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default ResendEmail;
