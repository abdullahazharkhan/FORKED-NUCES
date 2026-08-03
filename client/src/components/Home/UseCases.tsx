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
        className="scroll-mt-20 bg-[#F7F6FB] px-5 py-20 font-sans sm:px-8 sm:py-24 lg:py-28"
    >
        <div className="mx-auto grid max-w-[90rem] gap-8 lg:grid-cols-[minmax(18rem,0.68fr)_minmax(0,1.32fr)] lg:gap-10 xl:gap-14">
            <header className="lg:sticky lg:top-28 lg:self-start">
                <div className="relative overflow-hidden rounded-[2rem] bg-primarypurple p-7 text-white shadow-[0_24px_70px_rgba(76,45,178,0.2)] sm:p-9 lg:p-10">
                    <div
                        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primarygreen/15 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
                        aria-hidden="true"
                    />

                    <div className="relative flex items-center justify-between gap-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-xs">
                        <p className="flex items-center gap-2.5">
                            <span
                                className="h-2 w-2 rounded-full bg-primarygreen shadow-[0_0_0_5px_rgba(195,255,0,0.12)]"
                                aria-hidden="true"
                            />
                            Use-case index
                        </p>
                        <p className="font-mono tabular-nums text-primarygreen">01—06</p>
                    </div>
                    <h2 className="relative mt-8 max-w-lg text-balance text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[3.5rem]">
                        Find your way into the work.
                    </h2>
                    <p className="relative mt-6 max-w-md text-pretty text-base leading-7 text-white/80">
                        Whether you need one missing function or a full project team,
                        FORKED NUCES makes the next useful connection easier to find.
                    </p>
                    <p className="relative mt-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-semibold leading-6 text-white/90 backdrop-blur-sm">
                        Every path starts with a real project and ends with credited work.
                    </p>
                </div>
            </header>

            <ol className="grid gap-4 sm:grid-cols-2">
                {USE_CASES.map((useCase, index) => (
                    <li
                        key={useCase.title}
                        className="group relative min-h-64 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white p-6 shadow-[0_12px_35px_rgba(38,24,73,0.06)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primarypurple/20 hover:shadow-[0_20px_45px_rgba(74,43,155,0.12)] sm:p-7"
                    >
                        <div
                            className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primarygreen/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                            aria-hidden="true"
                        />
                        <div className="relative flex items-center justify-between gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarypurple/[0.08] font-mono text-xs font-bold tabular-nums text-primarypurple transition-colors duration-300 group-hover:bg-primarypurple group-hover:text-white">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <p className="text-right text-[0.65rem] font-bold uppercase tracking-[0.14em] text-black/55 sm:text-xs">
                                For {useCase.forWhom}
                            </p>
                        </div>
                        <h3 className="relative mt-8 text-xl font-bold tracking-[-0.025em] text-black sm:text-2xl">
                            {useCase.title}
                        </h3>
                        <p className="relative mt-3 max-w-xl text-sm leading-6 text-black/60 sm:text-base sm:leading-7">
                            {useCase.description}
                        </p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default UseCases;
