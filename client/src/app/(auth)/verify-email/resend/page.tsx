"use client";

import React, { useEffect } from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerUser, resendVerificationEmail } from "@/lib/authClient";

const resendEmailSchema = z.object({
    nuemail: z
        .string()
        .regex(
            /^[klmfp][0-9]{6}@nu\.edu\.pk$/,
            "Please enter a valid NU email address"
        ),
});

type ResendEmailForm = z.infer<typeof resendEmailSchema>;

type ApiError = {
    body?: string;
    detail?: string;
    message?: string;
    status?: string | number;
    statusText?: string;
};

const getErrorMessage = (err: unknown): string => {
    const e = err as ApiError | undefined;

    if (!e) return "Registration failed";

    if (e.body && typeof e.body === "object" && !Array.isArray(e.body)) {
        const firstKey = Object.keys(e.body)[0];
        if (firstKey && Array.isArray(e.body[firstKey])) {
            return String(e.body[firstKey][0]);
        }
        if (typeof e.body[firstKey] === "string") {
            return e.body[firstKey];
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
        formState: { errors, isValid, isSubmitting },
    } = useForm<ResendEmailForm>({
        resolver: zodResolver(resendEmailSchema),
        mode: "onChange",
    });

    const mutation = useMutation({
        mutationFn: async (data: ResendEmailForm) => {
            const payload = {
                nu_email: data.nuemail,
            };
            return await resendVerificationEmail(payload);
        },
        onSuccess: () => {
            reset();
        },
        onError: (err) => {
            console.error("Registration error", err);
        },
    });

    const onSubmit = (data: ResendEmailForm) => {
        mutation.mutate(data);
    };

    const [message, setMessage] = React.useState<string | null>(null);
    const [isError, setIsError] = React.useState(false);

    useEffect(() => {
        if (mutation.isError) {
            setMessage(getErrorMessage(mutation.error));
            setIsError(true);
        } else if (mutation.isSuccess) {
            const res = mutation.data as { message?: string } | undefined;
            setMessage(
                res?.message || "Registration successful. Check your email to verify."
            );
            setIsError(false);
        }
    }, [mutation.isError, mutation.isSuccess, mutation.error, mutation.data]);


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
                        type="text"
                        id="nuemail"
                        {...register("nuemail")}
                        className={getInputClass(errors.nuemail)}
                    />
                    {errors.nuemail && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.nuemail.message}
                        </p>
                    )}
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Resend Verification Email"}
                    </Button>
                </div>

                {message && (
                    <div
                        className={`mt-4 p-3 rounded text-sm ${isError
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
