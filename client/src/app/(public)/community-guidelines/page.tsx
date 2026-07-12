import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Community guidelines",
    description: "Collaboration and safety standards for FORKED NUCES.",
};

const guidelines = [
    {
        title: "Collaborate with consent",
        body: "Apply or invite through the collaboration workflow. Credit contributors only after they accept, and never pressure someone to join or disclose private details.",
    },
    {
        title: "Be constructive",
        body: "Discuss code and ideas, not personal traits. Give specific feedback, assume good intent where reasonable, and stop interactions when someone sets a clear boundary.",
    },
    {
        title: "Respect authorship and academic rules",
        body: "Attribute work, follow repository licenses, and comply with course and institution rules. Do not use the platform to submit copied work or arrange academic dishonesty.",
    },
    {
        title: "Protect people and systems",
        body: "Do not publish credentials, private student information, exploit code targeting real systems, malware, phishing, threats or instructions intended to cause harm.",
    },
    {
        title: "Keep the directory useful",
        body: "Avoid spam, deceptive links, fake engagement, duplicate promotional posts and automated collection of member data.",
    },
];

export default function CommunityGuidelinesPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 pb-16 pt-32 text-gray-900">
            <article className="space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primarypurple">
                        Effective 12 July 2026
                    </p>
                    <h1 className="text-4xl font-bold">Community guidelines</h1>
                    <p className="leading-7 text-gray-700">
                        FORKED NUCES should help students build together without making
                        anyone less safe. These standards apply to profiles, projects,
                        issues, comments and collaboration requests.
                    </p>
                </header>

                <div className="space-y-6">
                    {guidelines.map((guideline) => (
                        <section key={guideline.title} className="space-y-2">
                            <h2 className="text-2xl font-bold">{guideline.title}</h2>
                            <p className="leading-7 text-gray-700">{guideline.body}</p>
                        </section>
                    ))}
                </div>

                <section className="space-y-3 border-t pt-6">
                    <h2 className="text-2xl font-bold">Reporting and enforcement</h2>
                    <p className="leading-7 text-gray-700">
                        Use the Report action on a user or project when possible and include
                        enough context for moderators to assess it without adding unrelated
                        personal information. For an immediate safety or security concern,
                        contact{" "}
                        <Link className="font-semibold text-primarypurple underline" href="mailto:k230544@nu.edu.pk">
                            k230544@nu.edu.pk
                        </Link>
                        . Moderators may dismiss unsupported reports, request context,
                        remove content or restrict accounts. Deliberately false or abusive
                        reports can themselves lead to action.
                    </p>
                </section>
            </article>
        </main>
    );
}
