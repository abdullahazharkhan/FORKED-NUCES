"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import {
    MAX_PASSWORD_INPUT_LENGTH,
    newPasswordSchema,
} from "@/lib/authValidation";
import { useAuthStore } from "@/stores";

const passwordChangeSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required")
            .max(MAX_PASSWORD_INPUT_LENGTH),
        newPassword: newPasswordSchema,
        confirmPassword: z
            .string()
            .min(1, "Please confirm your new password")
            .max(MAX_PASSWORD_INPUT_LENGTH),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "Your new password must be different from your current password",
        path: ["newPassword"],
    });

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;
type AuthMessageResponse = { detail?: string; message?: string };

export default function ProfileSecurity() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const clearUser = useAuthStore((state) => state.clearUser);
    const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<PasswordChangeForm>({
        resolver: zodResolver(passwordChangeSchema),
        mode: "onChange",
    });

    const passwordChange = useMutation({
        mutationFn: async (data: PasswordChangeForm) => {
            const response = await authFetch("/api/auth/password/change", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: data.currentPassword,
                    new_password: data.newPassword,
                    confirm_password: data.confirmPassword,
                }),
            });
            return readAuthResponse<AuthMessageResponse>(
                response,
                "Unable to change your password."
            );
        },
    });

    const logoutAll = useMutation({
        mutationFn: async () => {
            const response = await authFetch("/api/auth/logout-all", {
                method: "POST",
            });
            return readAuthResponse<AuthMessageResponse>(
                response,
                "Unable to sign out all devices."
            );
        },
        onSuccess: () => {
            queryClient.clear();
            clearUser();
            router.replace("/login?reason=logout-all");
            router.refresh();
        },
    });

    const submitPasswordChange = (data: PasswordChangeForm) => {
        passwordChange.mutate(data, {
            onSuccess: () => {
                reset();
                passwordChange.reset();
                queryClient.clear();
                clearUser();
                router.replace("/login?reason=password-changed");
                router.refresh();
            },
        });
    };

    return (
        <div className="my-6 space-y-8">
            <section className="space-y-4 rounded-xl border border-gray-200 bg-primarypurple/5 p-6">
                <div>
                    <h2 className="text-2xl font-semibold">Change Password</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Choose a strong password you do not use on other services.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit(submitPasswordChange)}>
                    <div className="flex flex-col">
                        <label htmlFor="security-current-password" className="font-semibold">
                            Current Password
                        </label>
                        <input
                            id="security-current-password"
                            type="password"
                            autoComplete="current-password"
                            aria-invalid={Boolean(errors.currentPassword)}
                            aria-describedby={
                                errors.currentPassword
                                    ? "security-current-password-error"
                                    : undefined
                            }
                            {...register("currentPassword")}
                            className={`rounded border-2 p-2 outline-none focus:border-primarypurple/80 ${errors.currentPassword ? "border-red-500" : "border-gray-300"}`}
                        />
                        {errors.currentPassword && (
                            <p id="security-current-password-error" className="mt-1 text-sm text-red-600">
                                {errors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col">
                            <label htmlFor="security-new-password" className="font-semibold">
                                New Password
                            </label>
                            <input
                                id="security-new-password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.newPassword)}
                                aria-describedby={
                                    errors.newPassword
                                        ? "security-new-password-error"
                                        : undefined
                                }
                                {...register("newPassword")}
                                className={`rounded border-2 p-2 outline-none focus:border-primarypurple/80 ${errors.newPassword ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.newPassword && (
                                <p id="security-new-password-error" className="mt-1 text-sm text-red-600">
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="security-confirm-password" className="font-semibold">
                                Confirm New Password
                            </label>
                            <input
                                id="security-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={
                                    errors.confirmPassword
                                        ? "security-confirm-password-error"
                                        : undefined
                                }
                                {...register("confirmPassword")}
                                className={`rounded border-2 p-2 outline-none focus:border-primarypurple/80 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.confirmPassword && (
                                <p id="security-confirm-password-error" className="mt-1 text-sm text-red-600">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            isDisabled={!isValid || passwordChange.isPending}
                            className="bg-primarygreen font-bold text-black"
                        >
                            {passwordChange.isPending ? "Changing..." : "Change Password"}
                        </Button>
                    </div>

                    {passwordChange.isError && (
                        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
                            {getAuthFormErrorMessage(
                                passwordChange.error,
                                "Unable to change your password."
                            )}
                        </p>
                    )}
                </form>
            </section>

            <section className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
                <div>
                    <h2 className="text-2xl font-semibold text-red-800">
                        Sign Out Everywhere
                    </h2>
                    <p className="mt-1 text-sm text-red-700">
                        Revoke all active sessions on every browser and device,
                        including this one.
                    </p>
                </div>

                {!confirmLogoutAll ? (
                    <Button
                        type="button"
                        color="danger"
                        onPress={() => {
                            logoutAll.reset();
                            setConfirmLogoutAll(true);
                        }}
                    >
                        Sign Out All Devices
                    </Button>
                ) : (
                    <div className="space-y-3 rounded-lg border border-red-300 bg-white p-4">
                        <p className="text-sm font-semibold text-red-800">
                            Are you sure? You will need to log in again on every device.
                        </p>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="bordered"
                                isDisabled={logoutAll.isPending}
                                onPress={() => {
                                    logoutAll.reset();
                                    setConfirmLogoutAll(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                color="danger"
                                isLoading={logoutAll.isPending}
                                onPress={() => logoutAll.mutate()}
                            >
                                Confirm Sign Out
                            </Button>
                        </div>
                    </div>
                )}

                {logoutAll.isError && (
                    <p role="alert" className="rounded bg-white p-3 text-sm text-red-700">
                        {getAuthFormErrorMessage(
                            logoutAll.error,
                            "Unable to sign out all devices."
                        )}
                    </p>
                )}
            </section>
        </div>
    );
}
