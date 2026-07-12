import type { ElementType } from "react";
import {
    Blocks,
    BriefcaseBusiness,
    CodeXml,
    Lightbulb,
    Trophy,
    UsersRound,
} from "lucide-react";

const USE_CASES = [
    {
        title: "Unblock a project",
        description:
            "Post the exact feature or bug holding you back and find someone who has solved it before.",
        icon: Lightbulb,
    },
    {
        title: "Discover meaningful work",
        description:
            "Find active student projects that match your stack, interests, and available time.",
        icon: Blocks,
    },
    {
        title: "Practice open source",
        description:
            "Learn issue-driven collaboration, review, and contribution workflows on real codebases.",
        icon: CodeXml,
    },
    {
        title: "Build proof of skill",
        description:
            "Turn accepted contributions into a visible portfolio for internships and opportunities.",
        icon: BriefcaseBusiness,
    },
    {
        title: "Meet across batches",
        description:
            "Collaborate beyond your class and campus with FASTians who complement your strengths.",
        icon: UsersRound,
    },
    {
        title: "Form stronger teams",
        description:
            "Find reliable partners for hackathons, competitions, semester projects, and research.",
        icon: Trophy,
    },
] as const;

type UseCaseCardProps = {
    description: string;
    Icon: ElementType;
    index: number;
    title: string;
};

const UseCaseCard = ({ description, Icon, index, title }: UseCaseCardProps) => (
    <article className="group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_12px_40px_rgba(15,10,35,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primarypurple/25 hover:shadow-[0_20px_55px_rgba(111,67,254,0.12)]">
        <div className="flex items-start justify-between gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primarypurple/10 text-primarypurple transition-colors group-hover:bg-primarypurple group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-semibold text-black/30">
                {String(index + 1).padStart(2, "0")}
            </span>
        </div>
        <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-black/55">{description}</p>
        <div className="absolute bottom-0 left-0 h-1 w-0 bg-primarygreen transition-all duration-300 group-hover:w-full" />
    </article>
);

const UseCases = () => (
    <section id="usecases" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
            <div className="grid items-end gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primarypurple">
                        Built for student momentum
                    </p>
                    <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                        One community.
                        <br />More ways to grow.
                    </h2>
                </div>
                <p className="max-w-2xl text-base leading-7 text-black/55 lg:justify-self-end lg:text-lg lg:leading-8">
                    Whether you need one missing function or a full project team,
                    FORKED NUCES makes the next useful connection easier to find.
                </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {USE_CASES.map((useCase, index) => (
                    <UseCaseCard
                        key={useCase.title}
                        {...useCase}
                        Icon={useCase.icon}
                        index={index}
                    />
                ))}
            </div>
        </div>
    </section>
);

export default UseCases;
