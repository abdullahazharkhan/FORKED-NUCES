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
                    className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-black/60 transition-[background-color,color,transform] duration-200 hover:bg-primarypurple/[0.08] hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primarypurple active:scale-95"
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
