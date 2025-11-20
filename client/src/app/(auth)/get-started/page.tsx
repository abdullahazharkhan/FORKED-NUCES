"use client";

import React, { useState } from "react";
import useRegister from "../../../hooks/useRegister";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// zod schema
const getStartedSchema = z.object({
    fullName: z.string().min(1, "Full Name is required"),
    nuemail: z
        .string()
        .regex(
            /^[klmfp][0-9]{6}@nu\.edu\.pk$/,
            "NU Email must be a valid NU email address"
        ),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

type GetStartedForm = z.infer<typeof getStartedSchema>;

const GetStarted = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<GetStartedForm>({
        resolver: zodResolver(getStartedSchema),
        mode: "onChange", // realtime validation while typing
    });

    const [message, setMessage] = useState<string | null>(null)

    // call hook at component level (valid hook usage)
    const mutation = useRegister()

    const onSubmit = async (data: GetStartedForm) => {
        setMessage(null)
        try {
            const payload = {
                full_name: data.fullName,
                nu_email: data.nuemail,
                password: data.password,
            }
            const result = await mutation.mutateAsync(payload)
            console.log("Registration success", result)
            setMessage((result && result.message) || "Registration successful. Check your email to verify.")
        } catch (err: any) {
            // err may be a structured error from the API helper: { status, statusText, body }
            // Normalize into a debug object so console shows meaningful fields instead of `{}`
            const debug: Record<string, any> = {}
            try {
                if (err && typeof err === 'object') {
                    // copy enumerable props
                    Object.assign(debug, err)
                    // ensure body/detail/message are surfaced
                    debug.body = err.body ?? err.detail ?? err.message ?? null
                    debug.status = err.status ?? null
                    debug.statusText = err.statusText ?? null
                } else {
                    debug.body = String(err)
                }
            } catch (e) {
                debug.raw = String(err)
            }

            console.error('Registration error', debug)

            // Prefer server message/body, then statusText, then a generic message
            const msg = debug.body || (debug.status ? `${debug.status} ${debug.statusText || ''}`.trim() : 'Registration failed')
            setMessage(String(msg))
        }
    };

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

    return (
        <div className=" sm:w-2/3 mx-auto space-y-8">
            <h1 className="text-left text-4xl font-black italic tracking-[-0.20rem] uppercase underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit">
                Get Started
            </h1>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Full Name */}
                <div className="flex flex-col">
                    <label htmlFor="fullName" className="font-semibold text-lg">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        {...register("fullName")}
                        className={getInputClass(errors.fullName)}
                    />
                    {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.fullName.message}
                        </p>
                    )}
                </div>

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

                {/* Password */}
                <div className="flex flex-col">
                    <label htmlFor="password" className="font-semibold text-lg">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        {...register("password")}
                        className={getInputClass(errors.password)}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div>
                    already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primarypurple font-semibold underline"
                    >
                        Login
                    </Link>
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || isSubmitting}
                    >
                        Create Account
                    </Button>
                </div>
                {message && (
                    <div className="mt-4 p-3 rounded bg-white/80 text-sm">
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default GetStarted;
