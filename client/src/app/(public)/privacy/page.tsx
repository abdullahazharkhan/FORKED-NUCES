import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy notice",
    description: "How FORKED NUCES handles account and community data.",
};

const contactEmail = "k230544@nu.edu.pk";

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 pb-16 pt-32 text-gray-900">
            <article className="space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primarypurple">
                        Effective 12 July 2026
                    </p>
                    <h1 className="text-4xl font-bold">Privacy notice</h1>
                    <p className="leading-7 text-gray-700">
                        This notice explains how the FORKED NUCES project team handles
                        information when FAST NUCES community members use the platform.
                    </p>
                </header>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Information we handle</h2>
                    <p className="leading-7 text-gray-700">
                        We process your NU email address, name, verification and security
                        state, optional bio, avatar, GitHub link and skills. We also store
                        projects, issues, comments, likes, collaboration requests,
                        notifications and abuse reports created through the service.
                        Infrastructure logs can contain request identifiers, IP addresses,
                        timestamps, routes and error details; passwords and authentication
                        tokens must not be written to application logs.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Why we use it</h2>
                    <p className="leading-7 text-gray-700">
                        We use this information to verify community membership, operate
                        accounts, publish the content you choose to share, coordinate
                        collaboration, notify participants, prevent abuse, investigate
                        reports, secure the service and diagnose reliability problems.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Visibility and service providers</h2>
                    <p className="leading-7 text-gray-700">
                        Profiles, projects, issues, comments and contribution records are
                        visible to signed-in community members. Reports are restricted to
                        the reporter and authorized moderators. Hosting, database, email,
                        logging and backup providers process only the information needed to
                        operate those services. We do not expose passwords or session
                        tokens through profile or export APIs.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Your controls and retention</h2>
                    <p className="leading-7 text-gray-700">
                        You can edit your profile, download a structured copy of your data,
                        sign out all sessions and request account deletion from Profile.
                        Deletion deactivates and anonymizes the account while retaining
                        project and contribution records needed to preserve shared project
                        history. Operational logs and protected backups are retained under
                        the deployment operator&apos;s configured security and recovery
                        schedule, then rotated or deleted.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Security and questions</h2>
                    <p className="leading-7 text-gray-700">
                        Authentication cookies are HTTP-only, sessions can be revoked, and
                        access to moderation data is permission-checked. No online service
                        can promise perfect security. Report a suspected privacy or
                        security problem promptly to{" "}
                        <Link
                            className="font-semibold text-primarypurple underline"
                            href={`mailto:${contactEmail}`}
                        >
                            {contactEmail}
                        </Link>
                        . You may also use the in-product reporting flow for community
                        content.
                    </p>
                </section>

                <p className="border-t pt-6 text-sm text-gray-600">
                    Material changes will be published here with a new effective date.
                    Also read the{" "}
                    <Link className="font-semibold underline" href="/terms">
                        terms of use
                    </Link>{" "}
                    and{" "}
                    <Link className="font-semibold underline" href="/community-guidelines">
                        community guidelines
                    </Link>
                    .
                </p>
            </article>
        </main>
    );
}
