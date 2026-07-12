"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    function PasswordInput({ className = "", id, ...props }, ref) {
        const [isVisible, setIsVisible] = useState(false);
        const actionLabel = isVisible ? "Hide password" : "Show password";

        return (
            <div className="relative">
                <input
                    {...props}
                    id={id}
                    ref={ref}
                    type={isVisible ? "text" : "password"}
                    className={`w-full pr-13 ${className}`}
                />
                <button
                    type="button"
                    aria-label={actionLabel}
                    aria-pressed={isVisible}
                    aria-controls={id}
                    title={actionLabel}
                    onClick={() => setIsVisible((visible) => !visible)}
                    className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                >
                    {isVisible ? (
                        <EyeOff aria-hidden="true" size={19} />
                    ) : (
                        <Eye aria-hidden="true" size={19} />
                    )}
                </button>
            </div>
        );
    }
);
