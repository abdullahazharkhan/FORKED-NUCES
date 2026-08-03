const SKELETON_ROWS = ["first", "second", "third"] as const;

export default function ProjectDetailsSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading project details"
            className="animate-pulse space-y-6"
        >
            <span className="sr-only">Loading project details...</span>

            <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,#4d1fc9_0%,#6f3cff_55%,#7d51ff_100%)] p-6 shadow-[0_24px_65px_rgba(62,25,154,0.2)] sm:p-8">
                <div className="h-3 w-28 rounded-full bg-primarygreen/50" />
                <div className="mt-6 h-10 w-3/4 rounded-xl bg-white/20 sm:h-14 sm:w-2/3" />
                <div className="mt-4 h-4 w-56 rounded-full bg-white/15" />
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {SKELETON_ROWS.map((row) => (
                        <div key={row} className="h-20 rounded-2xl bg-white/10" />
                    ))}
                </div>
                <div className="mt-6 flex gap-2">
                    <div className="h-8 w-20 rounded-full bg-white/15" />
                    <div className="h-8 w-24 rounded-full bg-white/15" />
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_55px_rgba(42,25,86,0.07)] sm:p-8">
                <div className="h-6 w-32 rounded-lg bg-black/10" />
                <div className="mt-5 space-y-3">
                    <div className="h-4 w-full rounded bg-black/[0.07]" />
                    <div className="h-4 w-11/12 rounded bg-black/[0.07]" />
                    <div className="h-4 w-4/5 rounded bg-black/[0.07]" />
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_55px_rgba(42,25,86,0.07)] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="h-6 w-24 rounded-lg bg-black/10" />
                    <div className="h-10 w-28 rounded-xl bg-primarypurple/15" />
                </div>
                <div className="mt-5 space-y-3">
                    {SKELETON_ROWS.map((row) => (
                        <div key={row} className="h-16 rounded-2xl bg-[#f4f3f8]" />
                    ))}
                </div>
            </section>
        </div>
    );
}
