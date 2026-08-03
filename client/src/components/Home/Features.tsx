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
    <ul className="mt-7 grid gap-3 text-sm font-semibold sm:grid-cols-2">
        {points.map((point) => (
            <li
                key={point}
                className="flex items-start gap-2.5 rounded-2xl border border-black/5 bg-white/75 px-3.5 py-3 shadow-[0_8px_24px_rgba(35,22,74,0.05)]"
            >
                <Check
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primarypurple/10 p-0.5 text-primarypurple"
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
        className="overflow-hidden rounded-[2rem] border border-black/5 bg-white/75 p-3 shadow-[0_24px_70px_rgba(49,27,110,0.12)] backdrop-blur-sm"
    >
        <div className="flex items-center justify-between gap-4 rounded-[1.35rem] bg-[#18131F] px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(24,19,31,0.16)] sm:px-6 sm:text-xs">
            <p>Explore / active builds</p>
            <p className="font-mono text-primarygreen">124 indexed</p>
        </div>
        <div className="mx-1 mt-3 grid gap-3 rounded-2xl border border-black/5 bg-[#F8F7FB] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <p className="text-sm font-semibold text-black/55">
                Skills: frontend · campus utilities
            </p>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primarypurple sm:text-xs">
                Sorted by relevance
            </p>
        </div>
        <ol className="mt-3 grid gap-2 px-1 pb-1">
            {DISCOVERY_RESULTS.map((result, index) => (
                <li
                    key={result.title}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-[0_7px_20px_rgba(35,22,74,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-primarypurple/15 hover:shadow-[0_12px_28px_rgba(70,42,150,0.08)] sm:px-5 sm:py-5"
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
                    <p className="rounded-full bg-primarypurple/10 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-primarypurple sm:text-xs">
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
        className="rounded-[2rem] border border-primarypurple/10 bg-gradient-to-br from-primarypurple/15 via-white to-primarygreen/15 p-3 shadow-[0_24px_70px_rgba(49,27,110,0.12)] sm:p-5"
    >
        <div className="overflow-hidden rounded-[1.45rem] border border-black/5 bg-white text-black shadow-[0_12px_35px_rgba(35,22,74,0.07)]">
            <div className="flex items-start justify-between gap-5 px-4 py-4 sm:px-6 sm:py-5">
                <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primarypurple sm:text-xs">
                        Issue / 014
                    </p>
                    <h4 className="mt-2 text-lg font-black tracking-tight sm:text-xl">
                        Add keyboard navigation
                    </h4>
                </div>
                <p className="rounded-full bg-primarygreen/70 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.13em] shadow-[0_5px_16px_rgba(160,220,0,0.16)] sm:text-[0.65rem]">
                    Accepted
                </p>
            </div>
            <ol className="mx-3 mb-3 rounded-2xl bg-[#F8F7FB] px-3 py-2 sm:mx-4 sm:px-4">
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
                                <span className="absolute left-1/2 top-3 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-primarypurple/15" />
                            )}
                            <span
                                className={`relative mt-1 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${
                                    index === COLLABORATION_STEPS.length - 1
                                        ? "bg-primarygreen ring-2 ring-primarygreen/25"
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
        className="rounded-[2rem] border border-primarypurple/10 bg-gradient-to-br from-primarygreen/25 via-white to-primarypurple/10 p-3 text-black shadow-[0_24px_70px_rgba(49,27,110,0.12)]"
    >
        <div className="overflow-hidden rounded-[1.45rem] border border-black/5 bg-white/90 shadow-[0_12px_35px_rgba(35,22,74,0.07)]">
            <div className="grid gap-5 px-5 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primarypurple text-sm font-black text-white shadow-[0_9px_24px_rgba(106,61,255,0.22)]">
                    RM
                </div>
                <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/60 sm:text-xs">
                        Builder record / 076
                    </p>
                    <p className="mt-1 text-xl font-black tracking-tight">Ali Mahmood</p>
                </div>
                <p className="w-fit rounded-full bg-[#18131F] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-primarygreen shadow-sm">
                    NU verified
                </p>
            </div>
            <dl className="grid grid-cols-3 gap-2 px-3 pb-3">
                {[
                    ["07", "Projects"],
                    ["14", "Accepted PRs"],
                    ["05", "Collaborators"],
                ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-[#F6F4FA] px-3 py-5 sm:px-5">
                        <dd className="font-mono text-2xl font-black tabular-nums sm:text-3xl">
                            {value}
                        </dd>
                        <dt className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-black/60 sm:text-xs">
                            {label}
                        </dt>
                    </div>
                ))}
            </dl>
            <div className="mx-3 mb-3 grid gap-4 rounded-2xl bg-primarygreen/15 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                <div>
                    <p className="text-sm font-bold">Latest accepted contribution</p>
                    <p className="mt-1 text-xs leading-5 text-black/60">
                        Campus Navigator · accessible route controls
                    </p>
                </div>
                <p className="font-mono text-xs font-bold text-primarypurple">PR #128 ↗</p>
            </div>
        </div>
    </div>
);

const Features = () => (
    <section
        id="features"
        className="relative isolate scroll-mt-20 overflow-hidden border-b border-black/5 bg-[#FAF9FE] px-5 py-16 font-sans sm:px-8 sm:py-20 lg:py-24"
    >
        <div className="pointer-events-none absolute -left-32 top-40 -z-10 h-96 w-96 rounded-full bg-primarypurple/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-20 -z-10 h-96 w-96 rounded-full bg-primarygreen/10 blur-3xl" />

        <div className="mx-auto max-w-[90rem]">
            <header className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/75 px-6 py-8 shadow-[0_20px_60px_rgba(49,27,110,0.07)] backdrop-blur-sm sm:px-8 sm:py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:px-10">
                <div>
                    <p className="inline-flex rounded-full bg-primarygreen/25 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primarypurple">
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

            <div className="pt-8 sm:pt-10">
                <article className="grid w-full gap-10 rounded-[2rem] border border-black/5 bg-gradient-to-br from-white via-white to-primarypurple/5 p-6 shadow-[0_20px_60px_rgba(49,27,110,0.07)] sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16 lg:p-10">
                    <div>
                        <p className="inline-flex rounded-full bg-primarypurple/10 px-3 py-1.5 font-mono text-sm font-bold text-primarypurple">
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

                <article className="mt-8 grid w-full gap-10 rounded-[2rem] border border-black/5 bg-gradient-to-br from-white via-white to-primarygreen/10 p-6 shadow-[0_20px_60px_rgba(49,27,110,0.07)] sm:p-8 lg:grid-cols-[1.22fr_0.78fr] lg:items-center lg:gap-16 lg:p-10">
                    <div className="lg:order-2">
                        <p className="inline-flex rounded-full bg-primarypurple/10 px-3 py-1.5 font-mono text-sm font-bold text-primarypurple">
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

                <article className="mt-8 grid w-full gap-10 rounded-[2rem] border border-black/5 bg-gradient-to-br from-white via-white to-primarypurple/5 p-6 shadow-[0_20px_60px_rgba(49,27,110,0.07)] sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-16 lg:p-10">
                    <div>
                        <p className="inline-flex rounded-full bg-primarypurple/10 px-3 py-1.5 font-mono text-sm font-bold text-primarypurple">
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
