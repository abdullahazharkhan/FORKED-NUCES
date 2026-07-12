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
import { useAuthStore } from "@/stores";
import { MAX_PASSWORD_INPUT_LENGTH } from "@/lib/authValidation";
import { PasswordInput } from "@/components/PasswordInput";

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
        <div className="my-6 space-y-8">
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
                <div>
                    <h2 className="text-2xl font-semibold">Download Your Data</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Export your profile, projects, contributions, notifications and
                        submitted reports as a structured JSON file. Passwords and session
                        tokens are never included.
                    </p>
                </div>
                <Button
                    type="button"
                    className="bg-primarygreen font-bold text-black"
                    isLoading={exportData.isPending}
                    onPress={() => exportData.mutate()}
                >
                    {exportData.isPending ? "Preparing Export..." : "Download Data"}
                </Button>
                {exportData.isError && (
                    <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
                        {getAuthFormErrorMessage(
                            exportData.error,
                            "Unable to export account data."
                        )}
                    </p>
                )}
                {exportData.isSuccess && (
                    <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-800">
                        Your account data download is ready.
                    </p>
                )}
            </section>

            <section className="space-y-4 rounded-xl border border-red-300 bg-red-50 p-6">
                <div>
                    <h2 className="text-2xl font-semibold text-red-900">Delete Account</h2>
                    <p className="mt-1 text-sm leading-6 text-red-800">
                        This permanently deactivates your account, revokes every session and
                        removes personal profile data. Shared projects and contribution
                        history remain under an anonymous Deleted User identity so other
                        students&apos; project history is preserved.
                    </p>
                </div>

                {!showDeletion ? (
                    <Button
                        type="button"
                        color="danger"
                        onPress={() => {
                            deleteAccount.reset();
                            setShowDeletion(true);
                        }}
                    >
                        Start Account Deletion
                    </Button>
                ) : (
                    <form
                        className="space-y-4 rounded-lg border border-red-300 bg-white p-4"
                        onSubmit={handleSubmit((data) => deleteAccount.mutate(data))}
                    >
                        <div className="flex flex-col">
                            <label htmlFor="delete-current-password" className="font-semibold">
                                Current Password
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
                                className={`rounded border-2 p-2 outline-none focus:border-red-600 ${errors.currentPassword ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.currentPassword && (
                                <p
                                    id="delete-current-password-error"
                                    className="mt-1 text-sm text-red-700"
                                >
                                    {errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="delete-confirmation" className="font-semibold">
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
                                className={`rounded border-2 p-2 outline-none focus:border-red-600 ${errors.confirmation ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.confirmation && (
                                <p
                                    id="delete-confirmation-error"
                                    className="mt-1 text-sm text-red-700"
                                >
                                    {errors.confirmation.message}
                                </p>
                            )}
                        </div>

                        {deleteAccount.isError && (
                            <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-800">
                                {getAuthFormErrorMessage(
                                    deleteAccount.error,
                                    "Unable to delete the account."
                                )}
                            </p>
                        )}

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="bordered"
                                isDisabled={deleteAccount.isPending}
                                onPress={cancelDeletion}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="danger"
                                isDisabled={!isValid || deleteAccount.isPending}
                                isLoading={deleteAccount.isPending}
                            >
                                Permanently Delete Account
                            </Button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}
