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
        <header className="relative isolate h-[29rem] overflow-hidden border-y border-white/20 bg-primarypurple text-white sm:h-[27rem] lg:h-[22rem]">
            <span
                className="pointer-events-none absolute left-0 top-0 h-1 w-20 bg-primarygreen sm:w-32"
                aria-hidden="true"
            />
            <span
                className="pointer-events-none absolute bottom-8 right-8 hidden h-3 w-3 border border-primarygreen lg:block"
                aria-hidden="true"
            />
            <div
                className={`relative grid h-full grid-rows-[minmax(0,1fr)_auto] lg:grid-rows-1 ${actions ? "lg:grid-cols-[minmax(0,1fr)_19rem]" : ""}`}
            >
                <div className="flex min-h-0 flex-col justify-center px-6 py-9 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
                    <p className="mb-7 flex items-center gap-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primarygreen">
                        <span className="h-px w-9 bg-primarygreen" aria-hidden="true" />
                        {eyebrow}
                    </p>
                    <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl lg:text-[4rem]">
                        {title}
                    </h1>
                    <div className="mt-6 max-w-[62ch] text-pretty text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
                        {description}
                    </div>
                </div>
                {actions && (
                    <div className="flex min-h-24 items-center border-t border-white/15 px-6 py-6 sm:px-9 lg:min-h-0 lg:items-end lg:border-l lg:border-t-0 lg:px-7 lg:py-10">
                        <div className="w-full">{actions}</div>
                    </div>
                )}
            </div>
        </header>
    );
}
