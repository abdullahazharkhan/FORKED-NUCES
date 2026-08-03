import Link from "next/link";

const Footer = () => (
    <footer className="mx-3 mb-3 mt-14 rounded-[1.75rem] border border-black/[0.06] bg-white/65 px-5 py-7 text-xs text-black/60 shadow-[0_14px_45px_rgba(40,20,90,0.06)] backdrop-blur-md sm:mx-5 sm:px-8">
        <div className="mx-auto flex max-w-[87rem] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md leading-5">
                <span className="mb-1 flex items-center gap-2 font-bold tracking-[-0.02em] text-black">
                    <span className="h-2 w-2 rounded-full bg-primarygreen shadow-[0_0_0_4px_rgba(183,255,0,0.15)]" aria-hidden="true" />
                    FORK&apos;D NUCES
                </span>
                FASTians building, documenting, and improving work together.
            </p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] sm:justify-end">
                <Link className="inline-flex min-h-11 items-center rounded-lg px-2 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple" href="/privacy">Privacy</Link>
                <Link className="inline-flex min-h-11 items-center rounded-lg px-2 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple" href="/terms">Terms</Link>
                <Link className="inline-flex min-h-11 items-center rounded-lg px-2 transition-colors hover:bg-primarypurple/[0.06] hover:text-primarypurple" href="/community-guidelines">Guidelines</Link>
            </nav>
        </div>
    </footer>
);

export default Footer;
