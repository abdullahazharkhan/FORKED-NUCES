import type { Metadata } from "next";
import Link from "next/link";
import PublicDocument, {
    type PublicDocumentSection,
} from "@/components/PublicDocument";

export const metadata: Metadata = {
    title: "Privacy notice",
    description: "How FORKED NUCES handles account and community data.",
};

const contactEmail = "k230544@nu.edu.pk";

const SECTIONS: readonly PublicDocumentSection[] = [
    {
        id: "information-we-handle",
        title: "Information we handle",
        body: (
            <p>
                We process your NU email address, name, verification and security state,
                optional bio, avatar, GitHub link and skills. We also store projects,
                issues, comments, likes, collaboration requests, notifications and abuse
                reports created through the service. Infrastructure logs can contain
                request identifiers, IP addresses, timestamps, routes and error details;
                passwords and authentication tokens must not be written to application
                logs.
            </p>
        ),
    },
    {
        id: "why-we-use-it",
        title: "Why we use it",
        body: (
            <p>
                We use this information to verify community membership, operate accounts,
                publish the content you choose to share, coordinate collaboration, notify
                participants, prevent abuse, investigate reports, secure the service and
                diagnose reliability problems.
            </p>
        ),
    },
    {
        id: "visibility-and-providers",
        title: "Visibility and service providers",
        body: (
            <p>
                Profiles, projects, issues, comments and contribution records are visible
                to signed-in community members. Reports are restricted to the reporter and
                authorized moderators. Hosting, database, email, logging and backup
                providers process only the information needed to operate those services.
                We do not expose passwords or session tokens through profile or export
                APIs.
            </p>
        ),
    },
    {
        id: "controls-and-retention",
        title: "Your controls and retention",
        body: (
            <p>
                You can edit your profile, download a structured copy of your data, sign
                out all sessions and request account deletion from Profile. Deletion
                deactivates and anonymizes the account while retaining project and
                contribution records needed to preserve shared project history.
                Operational logs and protected backups are retained under the deployment
                operator&apos;s configured security and recovery schedule, then rotated or
                deleted.
            </p>
        ),
    },
    {
        id: "security-and-questions",
        title: "Security and questions",
        body: (
            <p>
                Authentication cookies are HTTP-only, sessions can be revoked, and access
                to moderation data is permission-checked. No online service can promise
                perfect security. Report a suspected privacy or security problem promptly
                to <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>. You may
                also use the in-product reporting flow for community content.
            </p>
        ),
    },
] as const;

export default function PrivacyPage() {
    return (
        <PublicDocument
            title="Privacy notice"
            description="This notice explains how the FORKED NUCES project team handles information when FAST NUCES community members use the platform."
            effectiveDate="12 July 2026"
            readTime="4 min"
            sections={SECTIONS}
            closing={
                <p>
                    Material changes will be published here with a new effective date.
                    Also read the <Link href="/terms">terms of use</Link> and{" "}
                    <Link href="/community-guidelines">community guidelines</Link>.
                </p>
            }
        />
    );
}
