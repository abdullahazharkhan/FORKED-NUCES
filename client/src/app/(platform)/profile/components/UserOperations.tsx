"use client";
import React from "react";
import { Database, FolderKanban, Plus, ShieldCheck, UserPen } from "lucide-react";

import AddProject from "./AddProject";
import AccountDataControls from "./AccountDataControls";
import EditProfile from "./EditProfile";
import ProfileSecurity from "./ProfileSecurity";
import YourProjects from "./YourProjects";

const operations = [
    { id: "projects", label: "Your Projects", icon: FolderKanban },
    { id: "edit", label: "Edit Profile", icon: UserPen },
    { id: "add", label: "Add Project", icon: Plus },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "data", label: "Your Data", icon: Database },
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
            <div className="mb-5 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primarygreen text-black shadow-[0_10px_24px_rgba(195,255,0,0.18)]">
                    <UserPen className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primarypurple">
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
            <div className="overflow-x-auto rounded-2xl border border-primarypurple/15 bg-[#fbfaff] p-1.5 shadow-[0_12px_36px_rgba(24,15,48,0.06)]">
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
                                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/20 ${
                                    isSelected
                                        ? "bg-primarypurple text-white shadow-[0_8px_22px_rgba(111,67,254,0.24)]"
                                        : "text-gray-500 hover:bg-white hover:text-primarypurple"
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
                className="rounded-[2rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primarypurple/15"
            >
                {renderOperation()}
            </div>
        </section>
    );
};

export default UserOperations;
