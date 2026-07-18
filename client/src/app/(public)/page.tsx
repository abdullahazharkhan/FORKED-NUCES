import About from "@/components/Home/About";
import Features from "@/components/Home/Features";
import Hero from "@/components/Home/Hero";
import UseCases from "@/components/Home/UseCases";

const COMMUNITY_SIGNALS = [
    { number: "01", value: "Build", label: "projects in the open" },
    { number: "02", value: "Connect", label: "with the right contributor" },
    { number: "03", value: "Grow", label: "through work that counts" },
] as const;

export default function Home() {
    return (
        <div className="overflow-hidden font-sans">
            <Hero />

            <section
                aria-label="How the community works"
                className="border-b border-black bg-primarygreen px-5 font-sans sm:px-8"
            >
                <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[0.45fr_1.55fr]">
                    <header className="flex items-center justify-between border-b border-black/25 py-5 lg:border-b-0 lg:border-r lg:pr-8">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-black/55 sm:text-xs">
                            The working loop
                        </p>
                        <p className="font-mono text-xs font-bold text-primarypurple lg:hidden">
                            01—03
                        </p>
                    </header>
                    <dl className="grid sm:grid-cols-3">
                        {COMMUNITY_SIGNALS.map((signal, index) => (
                            <div
                                key={signal.value}
                                className={`grid grid-cols-[2rem_auto_1fr] items-center gap-3 border-b border-black/25 py-5 last:border-b-0 sm:block sm:border-b-0 sm:px-6 sm:py-6 ${
                                    index > 0 ? "sm:border-l" : ""
                                }`}
                            >
                                <span className="font-mono text-[0.65rem] font-bold text-primarypurple sm:text-xs">
                                    {signal.number}
                                </span>
                                <dt className="text-xl font-black tracking-[-0.035em] sm:mt-3 sm:text-2xl">
                                    {signal.value}
                                </dt>
                                <dd className="text-sm leading-5 text-black/55 sm:mt-1">
                                    {signal.label}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <UseCases />
            <Features />
            <About />
        </div>
    );
}
