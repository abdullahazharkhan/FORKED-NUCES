import type { ReactNode } from "react";

type PlatformPageHeaderProps = {
    actions?: ReactNode;
    description: ReactNode;
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
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,#4d1fc9_0%,#6f3cff_55%,#7d51ff_100%)] text-white shadow-[0_24px_65px_rgba(62,25,154,0.2)]">
            <span
                className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/[0.09] blur-2xl"
                aria-hidden="true"
            />
            <span
                className="pointer-events-none absolute -bottom-36 left-[36%] h-72 w-72 rounded-full bg-primarygreen/[0.12] blur-3xl"
                aria-hidden="true"
            />
            <div
                className={`relative grid min-h-[21rem] ${actions ? "lg:grid-cols-[minmax(0,1fr)_19rem]" : ""}`}
            >
                <div className="flex min-h-0 flex-col justify-center px-6 py-10 sm:px-9 lg:px-12 lg:py-12">
                    <p className="mb-6 flex items-center gap-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primarygreen">
                        <span className="h-2 w-2 rounded-full bg-primarygreen shadow-[0_0_0_5px_rgba(183,255,0,0.12)]" aria-hidden="true" />
                        {eyebrow}
                    </p>
                    <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-[3.75rem]">
                        {title}
                    </h1>
                    <div className="mt-5 max-w-[62ch] text-pretty text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                        {description}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center px-6 pb-8 sm:px-9 lg:items-end lg:px-7 lg:py-10">
                        <div className="w-full">{actions}</div>
                    </div>
                )}
            </div>
        </header>
    );
}
