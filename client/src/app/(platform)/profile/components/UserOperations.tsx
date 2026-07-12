"use client";
import React from "react";

import AddProject from "./AddProject";
import AccountDataControls from "./AccountDataControls";
import EditProfile from "./EditProfile";
import ProfileSecurity from "./ProfileSecurity";
import YourProjects from "./YourProjects";

const operations = [
    { id: "projects", label: "Your Projects" },
    { id: "edit", label: "Edit Profile" },
    { id: "add", label: "Add Project" },
    { id: "security", label: "Security" },
    { id: "data", label: "Your Data" },
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
        <div>
            <div
                role="tablist"
                aria-label="Profile operations"
                className="flex flex-wrap border-b border-gray-200"
            >
                {operations.map((operation, index) => (
                    <button
                        key={operation.id}
                        id={`profile-tab-${operation.id}`}
                        type="button"
                        role="tab"
                        aria-selected={selectedOperation === operation.id}
                        aria-controls="profile-operation-panel"
                        tabIndex={selectedOperation === operation.id ? 0 : -1}
                        className={`cursor-pointer p-2 text-base font-medium duration-300 hover:text-black sm:text-lg ${selectedOperation === operation.id
                            ? "border-b-4 border-black text-black"
                            : "text-gray-600"
                            }`}
                        onClick={() => setSelectedOperation(operation.id)}
                        onKeyDown={(event) => handleTabKeyDown(event, index)}
                    >
                        {operation.label}
                    </button>
                ))}
            </div>
            <div
                id="profile-operation-panel"
                role="tabpanel"
                aria-labelledby={`profile-tab-${selectedOperation}`}
                tabIndex={0}
            >
                {renderOperation()}
            </div>
        </div>
    );
};

export default UserOperations;
