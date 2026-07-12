"use client";

import React, { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(
        (element) =>
            element.getAttribute("aria-hidden") !== "true" &&
            element.getClientRects().length > 0
    );
}

type AccessibleDialogProps = {
    children: React.ReactNode;
    className?: string;
    closeDisabled?: boolean;
    onClose: () => void;
    title: React.ReactNode;
};

export function AccessibleDialog({
    children,
    className = "max-w-md",
    closeDisabled = false,
    onClose,
    title,
}: AccessibleDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const closeDisabledRef = useRef(closeDisabled);
    const titleId = useId();

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        closeDisabledRef.current = closeDisabled;
    }, [closeDisabled]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const requestedInitialFocus = dialog.querySelector<HTMLElement>(
            "[data-dialog-initial-focus='true']"
        );
        (requestedInitialFocus ?? dialog).focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (!closeDisabledRef.current) {
                    event.preventDefault();
                    onCloseRef.current();
                }
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = getFocusableElements(dialog);
            if (focusableElements.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (activeElement === dialog || !dialog.contains(activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, []);

    const handleBackdropMouseDown = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        if (
            event.target === event.currentTarget &&
            !closeDisabledRef.current
        ) {
            onCloseRef.current();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`max-h-[calc(100vh-4rem)] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl outline-none ${className}`}
            >
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 id={titleId} className="text-lg font-semibold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={() => onCloseRef.current()}
                        disabled={closeDisabled}
                        className="text-sm text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
