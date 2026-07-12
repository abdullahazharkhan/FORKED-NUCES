import Link from "next/link";

const Footer = () => {
    return (
        <footer className="bg-black text-white py-4 px-6 text-sm">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="font-semibold tracking-wide">
                    FORK'd NUCES
                </p>
                <nav aria-label="Legal" className="flex flex-wrap justify-center gap-4 text-gray-300 sm:justify-end">
                    <Link className="hover:text-white" href="/privacy">Privacy</Link>
                    <Link className="hover:text-white" href="/terms">Terms</Link>
                    <Link className="hover:text-white" href="/community-guidelines">Guidelines</Link>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
