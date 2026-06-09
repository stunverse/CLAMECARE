import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <h2 className="pt-2 text-lg font-semibold text-foreground">
          1. Information we collect
        </h2>
        <p>
          We collect account information you provide (such as name and email),
          claim details you enter, and documents you upload to your private
          claim workspace.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          2. How we use your information
        </h2>
        <p>
          We use your information to provide the service: analyzing your
          documents, generating letters, and helping you organize your claim. We
          do not sell your personal information.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          3. Document security
        </h2>
        <p>
          Uploaded documents are stored securely and isolated to your account.
          Access is restricted by row-level security and signed URLs, and
          sensitive access is logged.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          4. AI processing
        </h2>
        <p>
          To provide analysis and document generation, content you submit may be
          processed by AI providers under contractual data-protection terms.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          5. Your choices
        </h2>
        <p>
          You may access, update, or delete your account and data at any time
          from your account settings.
        </p>

        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-foreground">
          This page is a template and should be reviewed by qualified legal
          counsel before launch.
        </p>
      </section>
    </article>
  );
}
