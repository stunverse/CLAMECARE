import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
  ListChecks,
  Landmark,
  Activity,
  CheckCircle2,
  HeartPulse,
  Car,
  Home as HomeIcon,
  Plane,
  PersonStanding,
  HeartHandshake,
  Briefcase,
  Clock,
  DollarSign,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <HelpsWith />
        <InsuranceTypes />
        <WhyChoose />
        <PricingTeaser />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------- header/footer ------------------------------ */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        ClaimCare<span className="text-brand"> AI</span>
      </span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pricing"
            className="hidden rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Logo />
          <p>© {new Date().getFullYear()} ClaimCare AI. Not a law firm.</p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
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
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/40 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm">
          <Sparkles className="size-3.5 text-brand" />
          The AI assistant for insurance claim denials
        </span>
        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Fight unfair insurance claim denials with AI.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Upload your denial letter, understand what went wrong, build your
          evidence file, and generate a professional appeal letter in minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "brand", size: "lg" }),
              "font-semibold",
            )}
          >
            Start your claim review
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "font-semibold",
            )}
          >
            View pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Informational assistance only — not a law firm, not legal advice.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- how it works ------------------------------ */

const STEPS = [
  {
    icon: Upload,
    title: "Upload your denial letter",
    body: "Securely add your documents to a private claim workspace.",
  },
  {
    icon: Sparkles,
    title: "Get an AI claim analysis",
    body: "Understand the denial reason, your strengths, and your weaknesses.",
  },
  {
    icon: ListChecks,
    title: "Build your evidence file",
    body: "Follow a tailored checklist of the proof that strengthens your claim.",
  },
  {
    icon: FileText,
    title: "Generate your appeal letter",
    body: "Produce a professional, ready-to-review appeal letter and export it.",
  },
];

function HowItWorks() {
  return (
    <Section id="how" title="How it works" subtitle="From denial to appeal in four steps.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="relative rounded-xl border border-border bg-card p-5"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-brand">
              <Icon className="size-5" />
            </span>
            <span className="absolute right-4 top-4 text-sm font-bold text-muted-foreground/40">
              {i + 1}
            </span>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- helps with -------------------------------- */

const HELPS = [
  { icon: ShieldCheck, label: "Denied claims" },
  { icon: Clock, label: "Delayed claims" },
  { icon: DollarSign, label: "Low settlement offers" },
  { icon: FileQuestion, label: "Missing document requests" },
  { icon: HelpCircle, label: "Confusing insurance decisions" },
];

function HelpsWith() {
  return (
    <Section
      title="What ClaimCare AI helps with"
      subtitle="Whatever went wrong with your claim, we help you respond."
      muted
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HELPS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-brand">
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------- insurance types ----------------------------- */

const TYPES = [
  { icon: HeartPulse, label: "Health" },
  { icon: Car, label: "Auto" },
  { icon: HomeIcon, label: "Home" },
  { icon: Plane, label: "Travel" },
  { icon: PersonStanding, label: "Disability" },
  { icon: HeartHandshake, label: "Life" },
  { icon: Briefcase, label: "Business" },
];

function InsuranceTypes() {
  return (
    <Section
      title="Supported insurance types"
      subtitle="Built for the most common US personal insurance claims."
    >
      <div className="flex flex-wrap justify-center gap-3">
        {TYPES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
          >
            <Icon className="size-4 text-brand" />
            {label}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- why choose -------------------------------- */

const REASONS = [
  {
    icon: Sparkles,
    title: "Clear explanations",
    body: "Plain-language analysis of your denial — no jargon, no guesswork.",
  },
  {
    icon: ListChecks,
    title: "Evidence checklist",
    body: "Know exactly which documents strengthen your claim and how to get them.",
  },
  {
    icon: FileText,
    title: "Appeal letters",
    body: "Generate professional appeal and demand letters, then export to PDF.",
  },
  {
    icon: Landmark,
    title: "State complaint guidance",
    body: "Prepare a complaint to your state Department of Insurance when needed.",
  },
  {
    icon: Activity,
    title: "Claim tracking",
    body: "Track status, deadlines, and your next best action from one workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & private",
    body: "Your documents are isolated to your account with strict access controls.",
  },
];

function WhyChoose() {
  return (
    <Section
      title="Why users choose ClaimCare AI"
      subtitle="Everything you need to respond with confidence."
      muted
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-brand">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ pricing teaser ----------------------------- */

function PricingTeaser() {
  return (
    <Section
      title="Plans for every claim"
      subtitle="Start small, upgrade when your case gets serious. Cancel anytime."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-5",
              plan.highlighted ? "border-brand ring-1 ring-brand/30" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{plan.name}</h3>
              {plan.highlighted && <Badge variant="info">Popular</Badge>}
            </div>
            <p className="mt-2 text-2xl font-bold">
              ${plan.priceMonthly}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {plan.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({
                  variant: plan.highlighted ? "brand" : "outline",
                  size: "sm",
                }),
                "mt-5",
              )}
            >
              Choose {plan.name}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/pricing"
          className="text-sm font-medium text-brand hover:underline"
        >
          Compare all features →
        </Link>
      </div>
    </Section>
  );
}

/* ------------------------------- final CTA --------------------------------- */

function FinalCta() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-primary p-10 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to take on your claim denial?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Upload your denial letter and get a clear, AI-powered plan in minutes.
        </p>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
            "mt-6 font-semibold",
          )}
        >
          Start your claim review
          <ArrowRight className="size-4" />
        </Link>
        <div className="mx-auto mt-8 max-w-2xl text-left">
          <DisclaimerBanner
            variant="primary"
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground/90"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- section shell ----------------------------- */

function Section({
  id,
  title,
  subtitle,
  muted,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("px-6 py-16", muted && "bg-secondary/30")}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
