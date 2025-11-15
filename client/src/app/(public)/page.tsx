import About from "@/components/Home/About";
import Features from "@/components/Home/Features";
import Hero from "@/components/Home/Hero";
import UseCases from "@/components/Home/UseCases";

export default function Home() {
    return (
        <div className="space-y-16">
            <Hero />

            <div className="w-full px-8 max-w-4xl mx-auto">
                <p className="text-center font-bold text-3xl">
                    Open-source your projects within FAST.
                    <br />
                    Get help where you're stuck, and help others where you shine.
                </p>
            </div>

            <section id="usecases">
                <UseCases />
            </section>

            <section id="features">
                <Features />
            </section>

            <section id="about">
                <About />
            </section>
        </div>
    );
}
