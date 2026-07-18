const USE_CASES = [
    {
        title: "Unblock a project",
        description:
            "Post the exact feature or bug holding you back and find someone who has solved it before.",
        forWhom: "Project owners",
    },
    {
        title: "Discover meaningful work",
        description:
            "Find active student projects that match your stack, interests, and available time.",
        forWhom: "Curious builders",
    },
    {
        title: "Practice open source",
        description:
            "Learn issue-driven collaboration, review, and contribution workflows on real codebases.",
        forWhom: "First contributors",
    },
    {
        title: "Build proof of skill",
        description:
            "Turn accepted contributions into a visible portfolio for internships and opportunities.",
        forWhom: "Career starters",
    },
    {
        title: "Meet across batches",
        description:
            "Collaborate beyond your class and campus with FASTians who complement your strengths.",
        forWhom: "Community members",
    },
    {
        title: "Form stronger teams",
        description:
            "Find reliable partners for hackathons, competitions, semester projects, and research.",
        forWhom: "Team builders",
    },
] as const;

const UseCases = () => (
    <section
        id="usecases"
        className="scroll-mt-20 border-b border-black/10 bg-[#E8EAEC] px-5 py-20 font-sans sm:px-8 sm:py-28 lg:py-32"
    >
        <div className="mx-auto grid max-w-[90rem] gap-12 lg:grid-cols-[minmax(17rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16 xl:gap-24">
            <header className="lg:sticky lg:top-28 lg:self-start">
                <div className="flex items-center justify-between border-b border-black/20 pb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primarypurple sm:text-xs">
                    <p>Use-case index</p>
                    <p className="font-mono tabular-nums">01—06</p>
                </div>
                <h2 className="mt-6 max-w-lg text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                    Find your way into the work.
                </h2>
                <p className="mt-6 max-w-md text-pretty text-base leading-7 text-black/55">
                    Whether you need one missing function or a full project team,
                    FORKED NUCES makes the next useful connection easier to find.
                </p>
                <p className="mt-8 hidden border-l-2 border-primarygreen pl-4 text-sm font-semibold leading-6 text-black/65 lg:block">
                    Every path starts with a real project and ends with credited work.
                </p>
            </header>

            <ol className="border-t border-black/25">
                {USE_CASES.map((useCase, index) => (
                    <li
                        key={useCase.title}
                        className="group grid gap-4 border-b border-black/20 py-6 transition-colors duration-200 hover:bg-white/45 sm:grid-cols-[3.5rem_minmax(12rem,0.75fr)_minmax(16rem,1fr)] sm:gap-6 sm:px-4 sm:py-8 lg:px-5"
                    >
                        <p className="flex items-center justify-between sm:block">
                            <span className="font-mono text-sm font-bold tabular-nums text-primarypurple">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm text-primarypurple transition-transform duration-200 group-hover:translate-x-1 sm:hidden">
                                ↗
                            </span>
                        </p>
                        <div>
                            <h3 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">
                                {useCase.title}
                            </h3>
                            <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-black/60 sm:text-xs">
                                For {useCase.forWhom}
                            </p>
                        </div>
                        <div className="flex gap-5">
                            <p className="max-w-xl text-sm leading-6 text-black/55 sm:text-base sm:leading-7">
                                {useCase.description}
                            </p>
                            <span
                                className="ml-auto hidden shrink-0 self-start text-lg text-primarypurple transition-transform duration-200 group-hover:translate-x-1 sm:block"
                                aria-hidden="true"
                            >
                                ↗
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default UseCases;
