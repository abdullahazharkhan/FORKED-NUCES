"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";

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
import { PasswordInput } from "@/components/PasswordInput";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_PANEL_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SECONDARY_BUTTON_CLASS,
} from "@/lib/platformStyles";

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
        <div className="space-y-6 pt-6">
            <section className={`${PLATFORM_PANEL_CLASS} overflow-hidden`} aria-labelledby="change-password-heading">
                <div className="h-1.5 bg-primarypurple" aria-hidden="true" />
                <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarypurple/10 text-primarypurple">
                        <KeyRound className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primarypurple">
                        Account security
                    </p>
                    <h2 id="change-password-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-black">Change password</h2>
                    <p className="mt-2 text-sm leading-6 text-black/55">
                        Choose a strong password you do not use on other services.
                    </p>
                    </div>
                </div>

                <form className="mt-7 space-y-5" onSubmit={handleSubmit(submitPasswordChange)}>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="security-current-password" className="text-sm font-bold text-black">
                            Current password
                        </label>
                        <PasswordInput
                            id="security-current-password"
                            autoComplete="current-password"
                            aria-invalid={Boolean(errors.currentPassword)}
                            aria-describedby={
                                errors.currentPassword
                                    ? "security-current-password-error"
                                    : undefined
                            }
                            {...register("currentPassword")}
                            className={`${PLATFORM_INPUT_CLASS} ${errors.currentPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                        />
                        {errors.currentPassword && (
                            <p id="security-current-password-error" className="text-xs font-medium text-red-600">
                                {errors.currentPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="security-new-password" className="text-sm font-bold text-black">
                                New password
                            </label>
                            <PasswordInput
                                id="security-new-password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.newPassword)}
                                aria-describedby={
                                    errors.newPassword
                                        ? "security-new-password-error"
                                        : undefined
                                }
                                {...register("newPassword")}
                                className={`${PLATFORM_INPUT_CLASS} ${errors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                            />
                            {errors.newPassword && (
                                <p id="security-new-password-error" className="text-xs font-medium text-red-600">
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="security-confirm-password" className="text-sm font-bold text-black">
                                Confirm new password
                            </label>
                            <PasswordInput
                                id="security-confirm-password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={
                                    errors.confirmPassword
                                        ? "security-confirm-password-error"
                                        : undefined
                                }
                                {...register("confirmPassword")}
                                className={`${PLATFORM_INPUT_CLASS} ${errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                            />
                            {errors.confirmPassword && (
                                <p id="security-confirm-password-error" className="text-xs font-medium text-red-600">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-black/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-black/45">
                            Use at least 8 characters. Changing your password signs you out everywhere.
                        </p>
                        <button
                            type="submit"
                            disabled={!isValid || passwordChange.isPending}
                            className={`${PLATFORM_PRIMARY_BUTTON_CLASS} shrink-0`}
                        >
                            {passwordChange.isPending ? "Changing..." : "Change password"}
                        </button>
                    </div>

                    {passwordChange.isError && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {getAuthFormErrorMessage(
                                passwordChange.error,
                                "Unable to change your password."
                            )}
                        </p>
                    )}
                </form>
                </div>
            </section>

            <section className={`${PLATFORM_PANEL_CLASS} overflow-hidden`} aria-labelledby="sign-out-everywhere-heading">
                <div className="h-1.5 bg-[#0d0b12]" aria-hidden="true" />
                <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.06] text-black">
                        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">
                        Session control
                    </p>
                    <h2 id="sign-out-everywhere-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-black">
                        Sign out everywhere
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-black/55">
                        Revoke all active sessions on every browser and device,
                        including this one.
                    </p>
                    </div>
                </div>

                {!confirmLogoutAll ? (
                    <button
                        type="button"
                        aria-expanded={false}
                        aria-controls="logout-all-confirmation"
                        onClick={() => {
                            logoutAll.reset();
                            setConfirmLogoutAll(true);
                        }}
                        className={`${PLATFORM_SECONDARY_BUTTON_CLASS} mt-6 gap-2`}
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out all devices
                    </button>
                ) : (
                    <div id="logout-all-confirmation" className="mt-6 space-y-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
                        <p className="text-sm font-bold leading-6 text-red-900">
                            Are you sure? You will need to log in again on every device.
                        </p>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={logoutAll.isPending}
                                onClick={() => {
                                    logoutAll.reset();
                                    setConfirmLogoutAll(false);
                                }}
                                className={PLATFORM_SECONDARY_BUTTON_CLASS}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={logoutAll.isPending}
                                onClick={() => logoutAll.mutate()}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:pointer-events-none disabled:opacity-55"
                            >
                                {logoutAll.isPending ? "Signing out..." : "Confirm sign out"}
                            </button>
                        </div>
                    </div>
                )}

                {logoutAll.isError && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {getAuthFormErrorMessage(
                            logoutAll.error,
                            "Unable to sign out all devices."
                        )}
                    </p>
                )}
                </div>
            </section>
        </div>
    );
}
