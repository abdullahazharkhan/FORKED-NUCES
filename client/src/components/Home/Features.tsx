import { Check } from "lucide-react";

const DISCOVERY_RESULTS = [
    {
        title: "Campus Navigator",
        stack: "Next.js · Django",
        issues: "03 open",
    },
    {
        title: "Course Flow",
        stack: "React · FastAPI",
        issues: "06 open",
    },
    {
        title: "Vision Lab",
        stack: "Python · PyTorch",
        issues: "02 open",
    },
] as const;

const COLLABORATION_STEPS = [
    { time: "09:12", label: "Issue published", detail: "Keyboard navigation" },
    { time: "10:04", label: "Areeba applied", detail: "Frontend · accessibility" },
    { time: "10:16", label: "Maintainer accepted", detail: "Scope confirmed" },
    { time: "16:41", label: "Contribution recorded", detail: "Pull request #128" },
] as const;

const FeaturePoints = ({ points }: { points: readonly string[] }) => (
    <ul className="mt-7 grid gap-3 border-t border-current/15 pt-5 text-sm font-semibold sm:grid-cols-2">
        {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
                <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primarypurple"
                    strokeWidth={3}
                    aria-hidden="true"
                />
                {point}
            </li>
        ))}
    </ul>
);

const DiscoveryRecord = () => (
    <div
        aria-label="Example project discovery index"
        className="border border-black/20 bg-[#E8EAEC]"
    >
        <div className="flex items-center justify-between gap-4 border-b border-black bg-black px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white sm:px-6 sm:text-xs">
            <p>Explore / active builds</p>
            <p className="font-mono text-primarygreen">124 indexed</p>
        </div>
        <div className="grid gap-3 border-b border-black/15 bg-white px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
            <p className="text-sm font-semibold text-black/55">
                Skills: frontend · campus utilities
            </p>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primarypurple sm:text-xs">
                Sorted by relevance
            </p>
        </div>
        <ol>
            {DISCOVERY_RESULTS.map((result, index) => (
                <li
                    key={result.title}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-black/15 bg-white/65 px-4 py-4 last:border-b-0 sm:px-6 sm:py-5"
                >
                    <span className="font-mono text-xs font-bold text-black/60">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                        <p className="text-sm font-bold tracking-tight sm:text-base">
                            {result.title}
                        </p>
                        <p className="mt-1 text-xs text-black/60">{result.stack}</p>
                    </div>
                    <p className="border-l border-black/15 pl-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-primarypurple sm:pl-5 sm:text-xs">
                        {result.issues}
                    </p>
                </li>
            ))}
        </ol>
    </div>
);

const CollaborationTimeline = () => (
    <div
        aria-label="Example issue collaboration timeline"
        className="border border-black/20 bg-primarypurple p-3 sm:p-5"
    >
        <div className="bg-white text-black">
            <div className="flex items-start justify-between gap-5 border-b border-black/15 px-4 py-4 sm:px-6 sm:py-5">
                <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primarypurple sm:text-xs">
                        Issue / 014
                    </p>
                    <h4 className="mt-2 text-lg font-black tracking-tight sm:text-xl">
                        Add keyboard navigation
                    </h4>
                </div>
                <p className="bg-primarygreen px-2.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.13em] sm:text-[0.65rem]">
                    Accepted
                </p>
            </div>
            <ol className="px-4 py-2 sm:px-6">
                {COLLABORATION_STEPS.map((step, index) => (
                    <li
                        key={step.label}
                        className="relative grid grid-cols-[3.3rem_1rem_minmax(0,1fr)] gap-3 py-4"
                    >
                        <time className="font-mono text-xs font-semibold tabular-nums text-black/60">
                            {step.time}
                        </time>
                        <span className="relative flex justify-center" aria-hidden="true">
                            {index < COLLABORATION_STEPS.length - 1 && (
                                <span className="absolute left-1/2 top-3 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-black/20" />
                            )}
                            <span
                                className={`relative mt-1 h-2.5 w-2.5 border-2 border-white ${
                                    index === COLLABORATION_STEPS.length - 1
                                        ? "bg-primarygreen ring-1 ring-black"
                                        : "bg-primarypurple"
                                }`}
                            />
                        </span>
                        <div>
                            <p className="text-sm font-bold">{step.label}</p>
                            <p className="mt-1 text-xs text-black/60">{step.detail}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    </div>
);

const ContributionRecord = () => (
    <div
        aria-label="Example contribution-backed profile"
        className="border border-black bg-primarygreen text-black"
    >
        <div className="grid gap-5 border-b border-black px-5 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
            <div className="grid h-14 w-14 place-items-center bg-primarypurple text-sm font-black text-white">
                RM
            </div>
            <div>
                <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/60 sm:text-xs">
                    Builder record / 076
                </p>
                <p className="mt-1 text-xl font-black tracking-tight">Ali Mahmood</p>
            </div>
            <p className="w-fit bg-black px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-primarygreen">
                NU verified
            </p>
        </div>
        <dl className="grid grid-cols-3 border-b border-black">
            {[
                ["07", "Projects"],
                ["14", "Accepted PRs"],
                ["05", "Collaborators"],
            ].map(([value, label], index) => (
                <div
                    key={label}
                    className={`px-3 py-5 sm:px-6 ${index > 0 ? "border-l border-black" : ""}`}
                >
                    <dd className="font-mono text-2xl font-black tabular-nums sm:text-3xl">
                        {value}
                    </dd>
                    <dt className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-black/60 sm:text-xs">
                        {label}
                    </dt>
                </div>
            ))}
        </dl>
        <div className="grid gap-4 bg-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
            <div>
                <p className="text-sm font-bold">Latest accepted contribution</p>
                <p className="mt-1 text-xs leading-5 text-black/60">
                    Campus Navigator · accessible route controls
                </p>
            </div>
            <p className="font-mono text-xs font-bold text-primarypurple">PR #128 ↗</p>
        </div>
    </div>
);

const Features = () => (
    <section
        id="features"
        className="scroll-mt-20 border-b border-black/10 bg-white px-5 py-20 font-sans sm:px-8 sm:py-28 lg:py-32"
    >
        <div className="mx-auto max-w-[90rem]">
            <header className="grid gap-6 border-b border-black/20 pb-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:pb-14">
                <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primarypurple">
                        System / three working records
                    </p>
                    <p className="mt-3 text-sm font-semibold text-black/60">
                        Everything between idea and impact.
                    </p>
                </div>
                <h2 className="max-w-4xl text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                    Collaboration that stays simple, visible, and fair.
                </h2>
            </header>

            <div className="pt-16 sm:pt-20">
                <article className="grid gap-10 border-t border-black/20 pt-8 lg:w-[94%] lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16 lg:pt-12">
                    <div>
                        <p className="font-mono text-sm font-bold text-primarypurple">
                            01 / DISCOVER
                        </p>
                        <h3 className="mt-5 text-balance text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">
                            Find the right project, not just another repository.
                        </h3>
                        <p className="mt-5 max-w-xl text-base leading-7 text-black/55">
                            Search by skills, technologies, open issues, and momentum.
                            Recommendations surface work where your contribution can matter
                            now.
                        </p>
                        <FeaturePoints
                            points={[
                                "Skill-aware recommendations",
                                "Search and technology filters",
                            ]}
                        />
                    </div>
                    <DiscoveryRecord />
                </article>

                <article className="mt-24 grid gap-10 border-t border-black/20 pt-8 lg:ml-auto lg:w-[94%] lg:grid-cols-[1.22fr_0.78fr] lg:items-center lg:gap-16 lg:pt-12">
                    <div className="lg:order-2">
                        <p className="font-mono text-sm font-bold text-primarypurple">
                            02 / COLLABORATE
                        </p>
                        <h3 className="mt-5 text-balance text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">
                            A clear path from issue to accepted contribution.
                        </h3>
                        <p className="mt-5 max-w-xl text-base leading-7 text-black/55">
                            Apply to issues, invite contributors, record decisions, and give
                            credit only when the work is genuinely completed.
                        </p>
                        <FeaturePoints
                            points={[
                                "Consent-based collaboration",
                                "Built-in activity and notifications",
                            ]}
                        />
                    </div>
                    <div className="lg:order-1">
                        <CollaborationTimeline />
                    </div>
                </article>

                <article className="mt-24 grid gap-10 border-t border-black/20 pt-8 lg:w-[94%] lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16 lg:pt-12">
                    <div>
                        <p className="font-mono text-sm font-bold text-primarypurple">
                            03 / GROW
                        </p>
                        <h3 className="mt-5 text-balance text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">
                            Let completed work tell your developer story.
                        </h3>
                        <p className="mt-5 max-w-xl text-base leading-7 text-black/55">
                            Your profile brings projects, skills, and accepted contributions
                            together into a living record of how you build with others.
                        </p>
                        <FeaturePoints
                            points={[
                                "Contribution-backed profiles",
                                "Community activity and rankings",
                            ]}
                        />
                    </div>
                    <ContributionRecord />
                </article>
            </div>
        </div>
    </section>
);

export default Features;
