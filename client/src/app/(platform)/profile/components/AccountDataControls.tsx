"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Database, Download, ShieldAlert, Trash2 } from "lucide-react";

import { authFetch } from "@/lib/authFetch";
import {
    getAuthFormErrorMessage,
    readAuthResponse,
} from "@/lib/authFormResponse";
import { useAuthStore } from "@/stores";
import { MAX_PASSWORD_INPUT_LENGTH } from "@/lib/authValidation";
import { PasswordInput } from "@/components/PasswordInput";
import {
    PLATFORM_INPUT_CLASS,
    PLATFORM_PANEL_CLASS,
    PLATFORM_PRIMARY_BUTTON_CLASS,
    PLATFORM_SECONDARY_BUTTON_CLASS,
} from "@/lib/platformStyles";

const deletionSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password is required")
        .max(MAX_PASSWORD_INPUT_LENGTH),
    confirmation: z.literal("DELETE", {
        error: 'Type "DELETE" exactly to confirm account deletion',
    }),
});

type DeletionForm = z.infer<typeof deletionSchema>;
type AuthMessageResponse = { message?: string; detail?: string };

function filenameFromResponse(response: Response): string {
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1]
        ?.replace(/[\\/\u0000-\u001f\u007f]/g, "_")
        .trim();
    return filename || "forked-nuces-data.json";
}

export default function AccountDataControls() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const clearUser = useAuthStore((state) => state.clearUser);
    const [showDeletion, setShowDeletion] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<DeletionForm>({
        resolver: zodResolver(deletionSchema),
        mode: "onChange",
        defaultValues: { currentPassword: "", confirmation: "" as "DELETE" },
    });

    const exportData = useMutation({
        mutationFn: async () => {
            const response = await authFetch("/api/auth/me/export");
            if (!response.ok) {
                await readAuthResponse(response, "Unable to export account data.");
            }
            return {
                blob: await response.blob(),
                filename: filenameFromResponse(response),
            };
        },
        onSuccess: ({ blob, filename }) => {
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
        },
    });

    const deleteAccount = useMutation({
        mutationFn: async (data: DeletionForm) => {
            const response = await authFetch("/api/auth/me/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: data.currentPassword,
                    confirmation: data.confirmation,
                }),
            });
            return readAuthResponse<AuthMessageResponse>(
                response,
                "Unable to delete the account."
            );
        },
        onSuccess: () => {
            queryClient.clear();
            clearUser();
            router.replace("/login?reason=account-deleted");
            router.refresh();
        },
    });

    const cancelDeletion = () => {
        setShowDeletion(false);
        deleteAccount.reset();
        reset();
    };

    return (
        <div className="space-y-6 pt-6">
            <section className={`${PLATFORM_PANEL_CLASS} overflow-hidden`} aria-labelledby="download-data-heading">
                <div className="h-1.5 bg-primarygreen" aria-hidden="true" />
                <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primarygreen/25 text-black">
                        <Database className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primarypurple">
                        Data portability
                    </p>
                    <h2 id="download-data-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-black">Download your data</h2>
                    <p className="mt-2 text-sm leading-6 text-black/55">
                        Export your profile, projects, contributions, notifications and
                        submitted reports as a structured JSON file. Passwords and session
                        tokens are never included.
                    </p>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={exportData.isPending}
                    onClick={() => exportData.mutate()}
                    className={`${PLATFORM_PRIMARY_BUTTON_CLASS} mt-6 gap-2`}
                >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {exportData.isPending ? "Preparing export..." : "Download data"}
                </button>
                {exportData.isError && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {getAuthFormErrorMessage(
                            exportData.error,
                            "Unable to export account data."
                        )}
                    </p>
                )}
                {exportData.isSuccess && (
                    <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        Your account data download is ready.
                    </p>
                )}
                </div>
            </section>

            <section className={`${PLATFORM_PANEL_CLASS} overflow-hidden`} aria-labelledby="delete-account-heading">
                <div className="h-1.5 bg-red-600" aria-hidden="true" />
                <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                        Danger zone
                    </p>
                    <h2 id="delete-account-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-black">Delete account</h2>
                    <p className="mt-2 text-sm leading-6 text-black/55">
                        This permanently deactivates your account, revokes every session and
                        removes personal profile data. Shared projects and contribution
                        history remain under an anonymous Deleted User identity so other
                        students&apos; project history is preserved.
                    </p>
                    </div>
                </div>

                {!showDeletion ? (
                    <button
                        type="button"
                        aria-expanded={false}
                        aria-controls="account-deletion-form"
                        onClick={() => {
                            deleteAccount.reset();
                            setShowDeletion(true);
                        }}
                        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Start account deletion
                    </button>
                ) : (
                    <form
                        id="account-deletion-form"
                        className="mt-6 space-y-5 rounded-2xl border border-red-200 bg-red-50/60 p-4 sm:p-5"
                        onSubmit={handleSubmit((data) => deleteAccount.mutate(data))}
                    >
                        <p className="text-sm font-bold leading-6 text-red-900">
                            Verify your identity and type the confirmation phrase below. This action cannot be undone.
                        </p>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="delete-current-password" className="text-sm font-bold text-black">
                                Current password
                            </label>
                            <PasswordInput
                                id="delete-current-password"
                                autoComplete="current-password"
                                autoFocus
                                aria-invalid={Boolean(errors.currentPassword)}
                                aria-describedby={
                                    errors.currentPassword
                                        ? "delete-current-password-error"
                                        : undefined
                                }
                                {...register("currentPassword")}
                                className={`${PLATFORM_INPUT_CLASS} focus:border-red-600 focus:ring-red-100 ${errors.currentPassword ? "border-red-500" : ""}`}
                            />
                            {errors.currentPassword && (
                                <p
                                    id="delete-current-password-error"
                                    className="text-xs font-medium text-red-700"
                                >
                                    {errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="delete-confirmation" className="text-sm font-bold text-black">
                                Type DELETE to confirm
                            </label>
                            <input
                                id="delete-confirmation"
                                type="text"
                                autoComplete="off"
                                spellCheck={false}
                                aria-invalid={Boolean(errors.confirmation)}
                                aria-describedby={
                                    errors.confirmation
                                        ? "delete-confirmation-error"
                                        : undefined
                                }
                                {...register("confirmation")}
                                className={`${PLATFORM_INPUT_CLASS} font-mono tracking-[0.15em] focus:border-red-600 focus:ring-red-100 ${errors.confirmation ? "border-red-500" : ""}`}
                            />
                            {errors.confirmation && (
                                <p
                                    id="delete-confirmation-error"
                                    className="text-xs font-medium text-red-700"
                                >
                                    {errors.confirmation.message}
                                </p>
                            )}
                        </div>

                        {deleteAccount.isError && (
                            <p role="alert" className="rounded-xl border border-red-200 bg-red-100 p-3 text-sm text-red-800">
                                {getAuthFormErrorMessage(
                                    deleteAccount.error,
                                    "Unable to delete the account."
                                )}
                            </p>
                        )}

                        <div className="flex flex-col-reverse gap-2 border-t border-red-200 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={deleteAccount.isPending}
                                onClick={cancelDeletion}
                                className={PLATFORM_SECONDARY_BUTTON_CLASS}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid || deleteAccount.isPending}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:pointer-events-none disabled:opacity-55"
                            >
                                {deleteAccount.isPending ? "Deleting account..." : "Permanently delete account"}
                            </button>
                        </div>
                    </form>
                )}
                </div>
            </section>
        </div>
    );
}
