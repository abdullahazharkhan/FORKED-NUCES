import type { Metadata } from "next";
import Link from "next/link";
import PublicDocument, {
    type PublicDocumentSection,
} from "@/components/PublicDocument";

export const metadata: Metadata = {
    title: "Terms of use",
    description: "Rules for using the FORKED NUCES community platform.",
};

const SECTIONS: readonly PublicDocumentSection[] = [
    {
        id: "eligibility-and-account-safety",
        title: "Eligibility and account safety",
        body: (
            <p>
                The service is intended for authorized FAST NUCES community members using
                their own NU email address. Keep your credentials private, provide
                accurate account information and notify the project team if you believe an
                account has been compromised. You are responsible for activity performed
                through your account until it is reported or revoked.
            </p>
        ),
    },
    {
        id: "your-content-and-code",
        title: "Your content and code",
        body: (
            <p>
                You keep ownership of content and code you create. You grant the service
                the limited permission needed to store, display and process content you
                submit. Only share material you are permitted to share, identify the
                license that applies to linked repositories, and do not present another
                person&apos;s work as your own.
            </p>
        ),
    },
    {
        id: "acceptable-use",
        title: "Acceptable use",
        body: (
            <p>
                Do not use the service for harassment, discrimination, threats, privacy
                violations, academic misconduct, malware, credential theft, illegal
                content, spam, automated scraping, security bypasses or disruption of the
                platform. Follow the more detailed{" "}
                <Link href="/community-guidelines">community guidelines</Link>.
            </p>
        ),
    },
    {
        id: "moderation-and-availability",
        title: "Moderation and availability",
        body: (
            <p>
                Authorized moderators may investigate reports, restrict access, remove
                content or deactivate accounts when needed to protect users, the
                institution or the service. The platform is provided as a community
                project and may change, pause or end; keep your own copies of important
                repositories and content.
            </p>
        ),
    },
    {
        id: "ending-use",
        title: "Ending use",
        body: (
            <p>
                You can stop using the service, revoke sessions, export your data or
                request account deletion from Profile. Shared contribution history can
                remain in anonymized form after deletion so collaborative records are not
                misleading or broken. The <Link href="/privacy">privacy notice</Link>{" "}
                explains the data lifecycle.
            </p>
        ),
    },
] as const;

export default function TermsPage() {
    return (
        <PublicDocument
            title="Terms of use"
            description="These terms set the operating rules for the FORKED NUCES student collaboration service. By creating or using an account, you agree to follow them."
            effectiveDate="12 July 2026"
            readTime="4 min"
            sections={SECTIONS}
            closing={
                <p>
                    Questions about these terms can be sent to{" "}
                    <Link href="mailto:k230544@nu.edu.pk">k230544@nu.edu.pk</Link>.
                    Material changes will be posted with a new effective date.
                </p>
            }
        />
    );
}
