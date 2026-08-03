"use client";

import React, { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const subscribeToClientRuntime = () => () => {};

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
    const isClient = useSyncExternalStore(
        subscribeToClientRuntime,
        () => true,
        () => false
    );
    const portalTarget = isClient ? document.body : null;

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
    }, [portalTarget]);

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

    if (!portalTarget) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#160a36]/60 px-4 py-5 backdrop-blur-md sm:py-8"
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`max-h-[calc(100svh-2.5rem)] w-full overflow-y-auto rounded-[1.75rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(249,247,253,0.99))] p-5 shadow-[0_32px_100px_rgba(35,13,86,0.32)] outline-none sm:max-h-[calc(100vh-4rem)] sm:rounded-[2rem] sm:p-7 ${className}`}
            >
                <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-primarypurple/[0.035] px-4 py-3.5">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primarypurple">
                            FORK&apos;D NUCES
                        </p>
                        <h2 id={titleId} className="mt-1 text-xl font-black tracking-[-0.025em] text-black sm:text-2xl">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close dialog"
                        onClick={() => onCloseRef.current()}
                        disabled={closeDisabled}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-black/55 shadow-sm transition-[transform,background-color,color] hover:-translate-y-0.5 hover:bg-primarypurple hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        portalTarget
    );
}
