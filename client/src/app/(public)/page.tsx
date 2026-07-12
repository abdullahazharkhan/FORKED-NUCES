import About from "@/components/Home/About";
import Features from "@/components/Home/Features";
import Hero from "@/components/Home/Hero";
import UseCases from "@/components/Home/UseCases";

const COMMUNITY_SIGNALS = [
    { value: "Build", label: "projects in the open" },
    { value: "Connect", label: "with the right contributor" },
    { value: "Grow", label: "through work that counts" },
] as const;

export default function Home() {
    return (
        <div className="overflow-hidden">
            <Hero />

            <section
                aria-label="How the community works"
                className="border-b border-black/[0.07] bg-white px-5 py-8 sm:px-8"
            >
                <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3 sm:gap-0">
                    {COMMUNITY_SIGNALS.map((signal, index) => (
                        <div
                            key={signal.value}
                            className={`flex items-center gap-4 py-2 sm:px-6 ${
                                index > 0 ? "sm:border-l sm:border-black/10" : ""
                            }`}
                        >
                            <span className="text-xl font-black tracking-tight text-primarypurple sm:text-2xl">
                                {signal.value}
                            </span>
                            <span className="text-sm leading-5 text-black/50">
                                {signal.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <UseCases />
            <Features />
            <About />
        </div>
    );
}
