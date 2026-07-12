import type { ReactNode } from "react";

type PlatformPageHeaderProps = {
    actions?: ReactNode;
    description: string;
    eyebrow: string;
    title: ReactNode;
};

export function PlatformPageHeader({
    actions,
    description,
    eyebrow,
    title,
}: PlatformPageHeaderProps) {
    return (
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#4820c7] via-primarypurple to-[#5225cf] px-6 py-8 text-white shadow-[0_24px_80px_rgba(45,19,118,0.28)] sm:px-9 sm:py-10 lg:px-12">
            <div
                className="landing-grid pointer-events-none absolute inset-0 opacity-35"
                aria-hidden="true"
            />
            <div
                className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border-[45px] border-primarygreen/15"
                aria-hidden="true"
            />
            <div
                className="absolute -bottom-32 right-1/4 -z-10 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl"
                aria-hidden="true"
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primarygreen">
                        {eyebrow}
                    </p>
                    <h1 className="text-3xl font-black leading-[1.04] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                        {description}
                    </p>
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        </header>
    );
}
