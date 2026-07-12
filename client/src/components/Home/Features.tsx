import type { ElementType } from "react";
import { ArrowUpRight, Radar, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
    {
        eyebrow: "01 · Discover",
        title: "Find the right project, not just another repository.",
        description:
            "Search by skills, technologies, open issues, and momentum. Recommendations surface work where your contribution can matter now.",
        points: ["Skill-aware recommendations", "Search and technology filters"],
        icon: Radar,
        tone: "bg-primarypurple text-white",
        iconTone: "bg-white/15 text-primarygreen",
    },
    {
        eyebrow: "02 · Collaborate",
        title: "A clear path from issue to accepted contribution.",
        description:
            "Apply to issues, invite contributors, record decisions, and give credit only when the work is genuinely completed.",
        points: ["Consent-based collaboration", "Built-in activity and notifications"],
        icon: ShieldCheck,
        tone: "bg-white text-black",
        iconTone: "bg-primarypurple/10 text-primarypurple",
    },
    {
        eyebrow: "03 · Grow",
        title: "Let completed work tell your developer story.",
        description:
            "Your profile brings projects, skills, and accepted contributions together into a living record of how you build with others.",
        points: ["Contribution-backed profiles", "Community activity and rankings"],
        icon: Sparkles,
        tone: "bg-primarygreen text-black",
        iconTone: "bg-black text-primarygreen",
    },
] as const;

type FeatureCardProps = {
    description: string;
    eyebrow: string;
    Icon: ElementType;
    iconTone: string;
    points: readonly string[];
    title: string;
    tone: string;
};

const FeatureCard = ({
    description,
    eyebrow,
    Icon,
    iconTone,
    points,
    title,
    tone,
}: FeatureCardProps) => (
    <article className={`group flex min-h-[28rem] flex-col rounded-3xl p-6 shadow-sm sm:p-8 ${tone}`}>
        <div className="flex items-start justify-between gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconTone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <ArrowUpRight
                className="h-5 w-5 opacity-40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100"
                aria-hidden="true"
            />
        </div>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] opacity-55">
            {eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em]">
            {title}
        </h3>
        <p className="mt-4 text-sm leading-6 opacity-65">{description}</p>
        <ul className="mt-auto space-y-2 border-t border-current/15 pt-6 text-sm font-semibold">
            {points.map((point) => (
                <li key={point} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {point}
                </li>
            ))}
        </ul>
    </article>
);

const Features = () => (
    <section id="features" className="bg-black/[0.025] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primarypurple">
                    Everything between idea and impact
                </p>
                <h2 className="mt-4 text-balance text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                    Collaboration that stays simple, visible, and fair.
                </h2>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} Icon={feature.icon} />
                ))}
            </div>
        </div>
    </section>
);

export default Features;
