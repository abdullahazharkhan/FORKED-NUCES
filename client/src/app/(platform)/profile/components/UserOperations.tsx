"use client";
import React from "react";
import { Database, FolderKanban, Plus, ShieldCheck, UserPen } from "lucide-react";

import AddProject from "./AddProject";
import AccountDataControls from "./AccountDataControls";
import EditProfile from "./EditProfile";
import ProfileSecurity from "./ProfileSecurity";
import YourProjects from "./YourProjects";

const operations = [
    { id: "projects", label: "Your projects", icon: FolderKanban },
    { id: "edit", label: "Edit profile", icon: UserPen },
    { id: "add", label: "Add project", icon: Plus },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "data", label: "Your data", icon: Database },
] as const;

type OperationId = (typeof operations)[number]["id"];

const UserOperations = () => {
    const [selectedOperation, setSelectedOperation] =
        React.useState<OperationId>("projects");

    const renderOperation = () => {
        switch (selectedOperation) {
            case "projects":
                return <YourProjects />;
            case "edit":
                return <EditProfile />;
            case "add":
                return <AddProject />;
            case "security":
                return <ProfileSecurity />;
            case "data":
                return <AccountDataControls />;
            default:
                return null;
        }
    };

    const handleTabKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        let nextIndex: number | null = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % operations.length;
        if (event.key === "ArrowLeft") {
            nextIndex = (index - 1 + operations.length) % operations.length;
        }
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = operations.length - 1;
        if (nextIndex === null) return;

        event.preventDefault();
        const nextOperation = operations[nextIndex];
        setSelectedOperation(nextOperation.id);
        document.getElementById(`profile-tab-${nextOperation.id}`)?.focus();
    };

    return (
        <section aria-labelledby="profile-workspace-heading">
            <div className="mb-5 flex items-start gap-4 rounded-3xl border border-black/[0.05] bg-white/70 p-5 shadow-[0_12px_38px_rgba(24,15,48,0.045)] backdrop-blur-sm sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primarygreen to-[#d8ff72] text-black shadow-[0_9px_24px_rgba(183,255,0,0.18)]">
                    <UserPen className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="font-mono text-[0.68rem] font-black tracking-[0.17em] text-primarypurple">
                        Account workspace
                    </p>
                    <h2
                        id="profile-workspace-heading"
                        className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl"
                    >
                        Manage your presence
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                        Keep your portfolio, profile, security, and account data
                        organized in one place.
                    </p>
                </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white/75 p-1.5 shadow-[0_10px_30px_rgba(24,15,48,0.05)] backdrop-blur-sm">
                <div
                    role="tablist"
                    aria-label="Profile operations"
                    aria-orientation="horizontal"
                    className="flex min-w-max gap-1"
                >
                    {operations.map((operation, index) => {
                        const Icon = operation.icon;
                        const isSelected = selectedOperation === operation.id;
                        return (
                            <button
                                key={operation.id}
                                id={`profile-tab-${operation.id}`}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                aria-controls="profile-operation-panel"
                                tabIndex={isSelected ? 0 : -1}
                                className={`relative inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15 ${
                                    isSelected
                                        ? "bg-white text-primarypurple shadow-[0_5px_16px_rgba(24,15,48,0.08)] ring-1 ring-inset ring-black/[0.04]"
                                        : "text-gray-600 hover:bg-primarypurple/[0.05] hover:text-primarypurple"
                                }`}
                                onClick={() => setSelectedOperation(operation.id)}
                                onKeyDown={(event) => handleTabKeyDown(event, index)}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {operation.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div
                id="profile-operation-panel"
                role="tabpanel"
                aria-labelledby={`profile-tab-${selectedOperation}`}
                tabIndex={0}
                className="rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
            >
                {renderOperation()}
            </div>
        </section>
    );
};

export default UserOperations;
