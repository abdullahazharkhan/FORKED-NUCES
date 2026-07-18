import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface PublicDocumentSection {
    id: string;
    title: string;
    body: ReactNode;
}

interface PublicDocumentProps {
    title: string;
    description: string;
    effectiveDate: string;
    readTime: string;
    sections: readonly PublicDocumentSection[];
    closing?: ReactNode;
}

const DOCUMENT_LINKS = [
    { label: "Privacy notice", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Community guidelines", href: "/community-guidelines" },
] as const;

export default function PublicDocument({
    title,
    description,
    effectiveDate,
    readTime,
    sections,
    closing,
}: PublicDocumentProps) {
    const documentIndex = Math.max(
        DOCUMENT_LINKS.findIndex((link) => link.label === title) + 1,
        1
    );

    return (
        <article className="bg-[#E8EAEC] font-sans text-black">
            <header className="relative overflow-hidden border-b border-black bg-primarypurple px-5 pb-16 pt-32 text-white sm:px-8 sm:pb-20 sm:pt-36 lg:px-12">
                <div
                    className="landing-grid pointer-events-none absolute inset-0 opacity-20"
                    aria-hidden="true"
                />

                <div className="landing-fade-up relative mx-auto max-w-[90rem]">
                    <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-4">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors duration-200 hover:text-white active:text-primarygreen focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            <ArrowLeft
                                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                                aria-hidden="true"
                            />
                            Back to home
                        </Link>
                        <p className="hidden font-mono text-xs font-bold uppercase tracking-[0.16em] text-primarygreen sm:block">
                            Field manual / 0{documentIndex}
                        </p>
                    </div>

                    <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-16 lg:pt-14">
                        <div className="max-w-4xl">
                            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primarygreen">
                                <span className="h-2 w-2 bg-primarygreen" aria-hidden="true" />
                                Community standards
                            </p>
                            <h1 className="mt-6 text-balance text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                                {title}
                            </h1>
                            <p className="mt-6 max-w-3xl text-pretty text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                                {description}
                            </p>
                        </div>

                        <dl className="grid grid-cols-2 border-y border-white/25 lg:grid-cols-1 lg:border-b-0 lg:border-l lg:border-t lg:pl-6">
                            <div className="py-4 pr-4 lg:border-b lg:border-white/20 lg:pr-0">
                                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/90">
                                    Effective
                                </dt>
                                <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-white/90">
                                    {effectiveDate}
                                </dd>
                            </div>
                            <div className="border-l border-white/20 py-4 pl-4 lg:border-l-0 lg:pl-0">
                                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/90">
                                    Reading time
                                </dt>
                                <dd className="mt-1 font-mono text-sm font-semibold text-white/90">
                                    {readTime}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-[90rem] items-start px-5 pb-20 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-12 lg:pb-28">
                <aside className="border-x border-b border-black/15 bg-white lg:sticky lg:top-20 lg:border-l lg:border-r-0">
                    <div className="border-b border-black/15 p-5 sm:p-6">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primarypurple sm:text-xs">
                            Document library
                        </p>
                        <nav aria-label="Community documents" className="mt-4">
                            <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1">
                                {DOCUMENT_LINKS.map((link, index) => (
                                    <li key={link.href} className="shrink-0">
                                        <Link
                                            href={link.href}
                                            aria-current={
                                                link.label === title ? "page" : undefined
                                            }
                                            className="group grid min-h-11 grid-cols-[1.75rem_1fr_auto] items-center gap-2 border border-black/15 px-3 text-sm font-semibold text-black/55 transition-[background-color,color,border-color,transform] duration-200 hover:border-primarypurple/40 hover:text-primarypurple active:translate-y-px aria-[current=page]:border-primarypurple aria-[current=page]:bg-primarypurple aria-[current=page]:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple lg:border-transparent"
                                        >
                                            <span className="font-mono text-[0.65rem] opacity-55">
                                                0{index + 1}
                                            </span>
                                            {link.label}
                                            <span
                                                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                                aria-hidden="true"
                                            >
                                                ↗
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <nav
                        aria-label={`Sections in ${title}`}
                        className="hidden border-b border-black/15 p-6 lg:block"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primarypurple">
                            On this page
                        </p>
                        <ol className="mt-4 space-y-1">
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className="grid min-h-10 grid-cols-[1.75rem_1fr] items-start gap-2 py-2 text-sm font-medium leading-5 text-black/60 transition-[color,transform] duration-200 hover:translate-x-1 hover:text-primarypurple active:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        <span className="font-mono text-[0.65rem] font-bold text-primarypurple">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <div className="bg-primarygreen p-5 text-black sm:p-6">
                        <p className="text-sm font-bold">Questions or concerns?</p>
                        <p className="mt-2 text-xs leading-5 text-black/55">
                            Contact the project team for help understanding these standards.
                        </p>
                        <Link
                            href="mailto:k230544@nu.edu.pk"
                            className="mt-5 inline-flex min-h-11 w-full items-center justify-between bg-black px-4 text-xs font-bold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primarypurple active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                            Contact the team
                            <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </aside>

                <div className="border-x border-b border-black/15 bg-white">
                    <nav
                        aria-label={`Sections in ${title}`}
                        className="border-b border-black/15 p-5 lg:hidden"
                    >
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primarypurple">
                            On this page
                        </p>
                        <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {sections.map((section, index) => (
                                <li key={section.id} className="shrink-0">
                                    <a
                                        href={`#${section.id}`}
                                        className="inline-flex min-h-10 items-center border border-black/15 px-3 text-sm font-semibold text-black/55 transition-[border-color,color,transform] duration-200 hover:border-primarypurple/40 hover:text-primarypurple active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        <span className="mr-2 font-mono text-[0.65rem] text-primarypurple">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <div className="divide-y divide-black/15 px-5 sm:px-8 lg:px-12">
                        {sections.map((section, index) => (
                            <section
                                id={section.id}
                                key={section.id}
                                className="scroll-mt-28 py-9 sm:grid sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6 sm:py-12 lg:py-14"
                            >
                                <span
                                    className="mb-4 block font-mono text-sm font-bold tabular-nums text-primarypurple sm:mb-0"
                                    aria-hidden="true"
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <h2 className="max-w-2xl text-2xl font-black leading-tight tracking-[-0.035em] text-black sm:text-3xl">
                                        {section.title}
                                    </h2>
                                    <div className="mt-4 max-w-[68ch] text-[0.95rem] leading-7 text-black/60 [&_a]:font-bold [&_a]:text-primarypurple [&_a]:underline [&_a]:decoration-primarypurple/30 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-black sm:text-base sm:leading-8">
                                        {section.body}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    {closing && (
                        <footer className="border-t border-black bg-primarygreen/25 px-5 py-7 sm:px-8 lg:px-12">
                            <div className="max-w-[68ch] text-sm leading-7 text-black/60 [&_a]:font-bold [&_a]:text-primarypurple [&_a]:underline [&_a]:decoration-primarypurple/30 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-black">
                                {closing}
                            </div>
                        </footer>
                    )}
                </div>
            </div>
        </article>
    );
}
