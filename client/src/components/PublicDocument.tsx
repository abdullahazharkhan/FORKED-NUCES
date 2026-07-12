import type { ReactNode } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowUpRight,
    Clock3,
    FileCheck2,
    Sparkles,
} from "lucide-react";

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
    return (
        <article className="relative isolate overflow-hidden bg-[#f7f6fb] text-black">
            <header className="relative overflow-hidden bg-primarypurple px-5 pb-24 pt-32 text-white sm:px-8 sm:pb-28 sm:pt-36">
                <div
                    className="landing-grid pointer-events-none absolute inset-0 opacity-30"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -left-36 top-10 h-80 w-80 rounded-full bg-primarygreen/15 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
                    aria-hidden="true"
                />

                <div className="landing-fade-up relative mx-auto max-w-7xl">
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <ArrowLeft
                            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                        Back to home
                    </Link>

                    <div className="mt-9 max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 text-primarygreen" aria-hidden="true" />
                            Community standards
                        </div>
                        <h1 className="mt-6 text-balance text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl md:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                            {description}
                        </p>

                        <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                                <FileCheck2 className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                <dt className="sr-only">Effective date</dt>
                                <dd>Effective {effectiveDate}</dd>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-primarygreen" aria-hidden="true" />
                                <dt className="sr-only">Estimated reading time</dt>
                                <dd>{readTime} read</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </header>

            <div className="relative mx-auto -mt-12 grid max-w-7xl items-start gap-6 px-5 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8 lg:pb-28">
                <div className="overflow-hidden rounded-[1.5rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(44,27,92,0.10)] sm:rounded-[1.75rem]">
                    <nav
                        aria-label={`Sections in ${title}`}
                        className="border-b border-black/[0.07] bg-[#fbfaff] px-5 py-5 sm:px-8"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primarypurple">
                            On this page
                        </p>
                        <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                            {sections.map((section, index) => (
                                <li key={section.id} className="shrink-0">
                                    <a
                                        href={`#${section.id}`}
                                        className="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black/65 transition-colors hover:border-primarypurple/35 hover:text-primarypurple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple"
                                    >
                                        {index + 1}. {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                        <p className="mt-2 hidden text-sm leading-6 text-black/50 lg:block">
                            Clear, practical standards for a safer student community.
                        </p>
                    </nav>

                    <div className="divide-y divide-black/[0.07] px-5 sm:px-8">
                        {sections.map((section, index) => (
                            <section
                                id={section.id}
                                key={section.id}
                                className="scroll-mt-28 py-8 sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5 sm:py-10"
                            >
                                <span
                                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primarypurple/10 text-sm font-black text-primarypurple sm:mb-0"
                                    aria-hidden="true"
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <h2 className="text-xl font-black tracking-[-0.025em] text-black sm:text-2xl">
                                        {section.title}
                                    </h2>
                                    <div className="mt-3 text-[0.95rem] leading-7 text-black/65 [&_a]:font-bold [&_a]:text-primarypurple [&_a]:underline [&_a]:decoration-primarypurple/30 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-black sm:text-base sm:leading-8">
                                        {section.body}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    {closing && (
                        <footer className="border-t border-black/[0.07] bg-primarygreen/15 px-5 py-7 sm:px-8">
                            <div className="text-sm leading-7 text-black/65 [&_a]:font-bold [&_a]:text-primarypurple [&_a]:underline [&_a]:decoration-primarypurple/30 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-black">
                                {closing}
                            </div>
                        </footer>
                    )}
                </div>

                <aside className="rounded-[1.5rem] border border-black/[0.08] bg-[#0d0b12] p-6 text-white shadow-[0_20px_55px_rgba(13,11,18,0.14)] lg:sticky lg:top-28">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primarygreen">
                        Document library
                    </p>
                    <nav aria-label="Community documents" className="mt-4">
                        <ul className="space-y-1">
                            {DOCUMENT_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        aria-current={link.label === title ? "page" : undefined}
                                        className="group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarygreen"
                                    >
                                        {link.label}
                                        <ArrowUpRight
                                            className="h-4 w-4 text-white/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primarygreen"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <p className="text-sm font-bold">Questions or concerns?</p>
                        <p className="mt-2 text-sm leading-6 text-white/50">
                            Contact the project team for help understanding these standards.
                        </p>
                        <Link
                            href="mailto:k230544@nu.edu.pk"
                            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primarygreen px-4 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                        >
                            Contact the team
                        </Link>
                    </div>
                </aside>
            </div>
        </article>
    );
}
