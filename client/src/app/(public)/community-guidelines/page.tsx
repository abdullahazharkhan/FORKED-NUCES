import type { Metadata } from "next";
import Link from "next/link";
import PublicDocument, {
    type PublicDocumentSection,
} from "@/components/PublicDocument";

export const metadata: Metadata = {
    title: "Community guidelines",
    description: "Collaboration and safety standards for FORKED NUCES.",
};

const SECTIONS: readonly PublicDocumentSection[] = [
    {
        id: "collaborate-with-consent",
        title: "Collaborate with consent",
        body: (
            <p>
                Apply or invite through the collaboration workflow. Credit contributors
                only after they accept, and never pressure someone to join or disclose
                private details.
            </p>
        ),
    },
    {
        id: "be-constructive",
        title: "Be constructive",
        body: (
            <p>
                Discuss code and ideas, not personal traits. Give specific feedback,
                assume good intent where reasonable, and stop interactions when someone
                sets a clear boundary.
            </p>
        ),
    },
    {
        id: "respect-authorship",
        title: "Respect authorship and academic rules",
        body: (
            <p>
                Attribute work, follow repository licenses, and comply with course and
                institution rules. Do not use the platform to submit copied work or
                arrange academic dishonesty.
            </p>
        ),
    },
    {
        id: "protect-people-and-systems",
        title: "Protect people and systems",
        body: (
            <p>
                Do not publish credentials, private student information, exploit code
                targeting real systems, malware, phishing, threats or instructions
                intended to cause harm.
            </p>
        ),
    },
    {
        id: "keep-the-directory-useful",
        title: "Keep the directory useful",
        body: (
            <p>
                Avoid spam, deceptive links, fake engagement, duplicate promotional posts
                and automated collection of member data.
            </p>
        ),
    },
    {
        id: "reporting-and-enforcement",
        title: "Reporting and enforcement",
        body: (
            <p>
                Use the Report action on a user or project when possible and include
                enough context for moderators to assess it without adding unrelated
                personal information. For an immediate safety or security concern,
                contact{" "}
                <Link href="mailto:k230544@nu.edu.pk">k230544@nu.edu.pk</Link>.
                Moderators may dismiss unsupported reports, request context, remove
                content or restrict accounts. Deliberately false or abusive reports can
                themselves lead to action.
            </p>
        ),
    },
] as const;

export default function CommunityGuidelinesPage() {
    return (
        <PublicDocument
            title="Community guidelines"
            description="FORKED NUCES should help students build together without making anyone less safe. These standards apply to profiles, projects, issues, comments and collaboration requests."
            effectiveDate="12 July 2026"
            readTime="3 min"
            sections={SECTIONS}
        />
    );
}
