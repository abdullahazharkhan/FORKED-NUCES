import Link from "next/link";

const Footer = () => (
    <footer className="mt-14 border-t border-black/15 bg-white/70 px-5 py-7 text-xs text-black/60 sm:px-8">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md leading-5">
                <span className="mb-1 flex items-center gap-2 font-bold tracking-[-0.02em] text-black">
                    <span className="h-2 w-2 bg-primarygreen ring-1 ring-black/20" aria-hidden="true" />
                    FORK&apos;D NUCES
                </span>
                FASTians building, documenting, and improving work together.
            </p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] sm:justify-end">
                <Link className="border-b border-transparent pb-1 transition-colors hover:border-primarypurple hover:text-primarypurple active:translate-y-px" href="/privacy">Privacy</Link>
                <Link className="border-b border-transparent pb-1 transition-colors hover:border-primarypurple hover:text-primarypurple active:translate-y-px" href="/terms">Terms</Link>
                <Link className="border-b border-transparent pb-1 transition-colors hover:border-primarypurple hover:text-primarypurple active:translate-y-px" href="/community-guidelines">Guidelines</Link>
            </nav>
        </div>
    </footer>
);

export default Footer;
