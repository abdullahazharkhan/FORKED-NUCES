"use client";

import React, { useEffect } from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/authClient"
import { useRouter } from "next/navigation";

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

const GetStarted = () => {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<GetStartedForm>({
        resolver: zodResolver(getStartedSchema),
        mode: "onChange",
    });

    const mutation = useMutation({
        mutationFn: async (data: GetStartedForm) => {
            const payload = {
                full_name: data.fullName,
                nu_email: data.nuemail,
                password: data.password,
            };
            return await registerUser(payload);
        },
        onSuccess: () => {
            reset();
            router.push("/login");
        },
        onError: (err) => {
            console.error("Registration error", err);
        },
    });

    const onSubmit = (data: GetStartedForm) => {
        mutation.mutate(data);
    };

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

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


    return (
        <div className="sm:w-2/3 mx-auto space-y-8">
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
                        isDisabled={!isValid || mutation.isPending || mutation.isSuccess}
                    >
                        {mutation.isPending ? "Creating..." : "Create Account"}
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

export default GetStarted;