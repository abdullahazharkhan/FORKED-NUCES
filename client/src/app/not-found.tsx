import Link from "next/link";

export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-mono text-sm text-primarypurple">404</p>
            <h1 className="text-4xl font-bold">Page not found</h1>
            <p className="text-gray-700">The page you requested does not exist or is no longer available.</p>
            <Link
                href="/"
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-black/80"
            >
                Return home
            </Link>
        </main>
    );
}
