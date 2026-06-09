import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <h2 className="pt-2 text-lg font-semibold text-foreground">
          1. Acceptance of terms
        </h2>
        <p>
          By creating an account or using ClaimCare AI, you agree to these Terms
          of Service and acknowledge our Privacy Policy and Legal Disclaimer.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          2. Nature of the service
        </h2>
        <p>
          ClaimCare AI provides informational, documentary, and administrative
          assistance for insurance claims. It is not a law firm and does not
          provide legal advice. You are responsible for reviewing all generated
          documents before using them.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          3. Accounts
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity under your account.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          4. Subscriptions and billing
        </h2>
        <p>
          Paid plans are billed through our payment processor. Quotas, upgrades,
          downgrades, and cancellations are governed by the plan you select.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          5. Acceptable use
        </h2>
        <p>
          You agree not to misuse the service, submit fraudulent information, or
          use the platform to falsify documents or evidence.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-foreground">
          6. No guarantee of outcome
        </h2>
        <p>
          ClaimCare AI does not guarantee that any appeal, complaint, or
          negotiation will succeed.
        </p>

        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-foreground">
          This page is a template and should be reviewed by qualified legal
          counsel before launch.
        </p>
      </section>
    </article>
  );
}
