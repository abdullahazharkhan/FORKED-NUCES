import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of use",
    description: "Rules for using the FORKED NUCES community platform.",
};

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 pb-16 pt-32 text-gray-900">
            <article className="space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primarypurple">
                        Effective 12 July 2026
                    </p>
                    <h1 className="text-4xl font-bold">Terms of use</h1>
                    <p className="leading-7 text-gray-700">
                        These terms set the operating rules for the FORKED NUCES student
                        collaboration service. By creating or using an account, you agree
                        to follow them.
                    </p>
                </header>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Eligibility and account safety</h2>
                    <p className="leading-7 text-gray-700">
                        The service is intended for authorized FAST NUCES community members
                        using their own NU email address. Keep your credentials private,
                        provide accurate account information and notify the project team if
                        you believe an account has been compromised. You are responsible
                        for activity performed through your account until it is reported or
                        revoked.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Your content and code</h2>
                    <p className="leading-7 text-gray-700">
                        You keep ownership of content and code you create. You grant the
                        service the limited permission needed to store, display and process
                        content you submit. Only share material you are permitted to share,
                        identify the license that applies to linked repositories, and do
                        not present another person&apos;s work as your own.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Acceptable use</h2>
                    <p className="leading-7 text-gray-700">
                        Do not use the service for harassment, discrimination, threats,
                        privacy violations, academic misconduct, malware, credential theft,
                        illegal content, spam, automated scraping, security bypasses or
                        disruption of the platform. Follow the more detailed{" "}
                        <Link className="font-semibold text-primarypurple underline" href="/community-guidelines">
                            community guidelines
                        </Link>
                        .
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Moderation and availability</h2>
                    <p className="leading-7 text-gray-700">
                        Authorized moderators may investigate reports, restrict access,
                        remove content or deactivate accounts when needed to protect users,
                        the institution or the service. The platform is provided as a
                        community project and may change, pause or end; keep your own copies
                        of important repositories and content.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-bold">Ending use</h2>
                    <p className="leading-7 text-gray-700">
                        You can stop using the service, revoke sessions, export your data or
                        request account deletion from Profile. Shared contribution history
                        can remain in anonymized form after deletion so collaborative
                        records are not misleading or broken. The{" "}
                        <Link className="font-semibold text-primarypurple underline" href="/privacy">
                            privacy notice
                        </Link>{" "}
                        explains the data lifecycle.
                    </p>
                </section>

                <p className="border-t pt-6 text-sm text-gray-600">
                    Questions about these terms can be sent to{" "}
                    <Link className="font-semibold underline" href="mailto:k230544@nu.edu.pk">
                        k230544@nu.edu.pk
                    </Link>
                    . Material changes will be posted with a new effective date.
                </p>
            </article>
        </main>
    );
}
