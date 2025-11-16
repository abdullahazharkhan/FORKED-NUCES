"use client";

import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// zod schema
const loginSchema = z.object({
    nuemail: z
        .string()
        .regex(
            /^[klmfp][0-9]{6}@nu\.edu\.pk$/,
            "Please enter a valid NU email address"
        ),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const onSubmit = (data: LoginForm) => {
        console.log("Form is valid, sending data:", data);
        // TODO: call your API here
    };

    const baseInputClasses =
        "p-2 rounded border-2 focus:border-primarypurple/80 focus:ring-0 outline-none transition-colors duration-200";

    const getInputClass = (fieldError?: unknown) =>
        `${baseInputClasses} ${fieldError ? "border-red-500" : "border-gray-300"}`;

    return (
        <div className=" sm:w-2/3 mx-auto space-y-8">
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
                    don't have an account?{" "}
                    <Link
                        href="/get-started"
                        className="text-primarypurple font-semibold underline"
                    >
                        Get Started
                    </Link>
                </div>

                <div className="flex w-full justify-end">
                    <Button
                        className="bg-primarygreen text-black font-bold"
                        type="submit"
                        isDisabled={!isValid || isSubmitting}
                    >
                        Login
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Login;
