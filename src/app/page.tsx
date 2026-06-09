import Link from "next/link";
import { ShieldCheck, FileText, Sparkles, ArrowRight } from "lucide-react";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

/**
 * Temporary landing placeholder for ClaimCare AI.
 * The full marketing landing page (cahier des charges §48) will be built
 * in a later step; this establishes branding and the design system.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              ClaimCare<span className="text-brand"> AI</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5 text-brand" />
          AI assistant for insurance claim denials
        </span>

        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Fight unfair insurance claim denials with AI.
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Upload your denial letter, understand what went wrong, build your
          evidence file, and generate a professional appeal letter in minutes.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            Start your claim review
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-6 font-semibold transition-colors hover:bg-accent"
          >
            View pricing
          </Link>
        </div>

        {/* How it works (condensed preview) */}
        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Upload your denial letter",
              body: "Securely add your documents to a private claim workspace.",
            },
            {
              icon: Sparkles,
              title: "Get an AI claim analysis",
              body: "Understand the denial reason, strengths, and weaknesses.",
            },
            {
              icon: ShieldCheck,
              title: "Generate your appeal",
              body: "Produce a professional, ready-to-review appeal letter.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-brand">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 w-full max-w-3xl">
          <DisclaimerBanner variant="primary" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ClaimCare AI. Not a law firm.</p>
          <nav className="flex items-center gap-4">
            <Link href="/disclaimer" className="hover:text-foreground">
              Disclaimer
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
