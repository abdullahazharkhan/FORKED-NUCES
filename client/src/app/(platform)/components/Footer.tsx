import Link from "next/link";

const Footer = () => (
    <footer className="border-t border-black/[0.07] bg-white px-5 py-5 text-xs text-black/45 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <p>
                <span className="font-bold text-black">FORK&apos;D NUCES</span> · FASTians build better together.
            </p>
            <nav aria-label="Legal" className="flex flex-wrap justify-center gap-5 sm:justify-end">
                <Link className="transition-colors hover:text-primarypurple" href="/privacy">Privacy</Link>
                <Link className="transition-colors hover:text-primarypurple" href="/terms">Terms</Link>
                <Link className="transition-colors hover:text-primarypurple" href="/community-guidelines">Guidelines</Link>
            </nav>
        </div>
    </footer>
);

export default Footer;
