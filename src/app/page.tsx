import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
  ListChecks,
  Mail,
  Bell,
  CheckCircle2,
  Clock,
  CalendarClock,
  Landmark,
  UserCheck,
  Building2,
} from "lucide-react";
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
        <ForWho />
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
        MyDue<span className="text-brand">Guard</span>
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
            Tarifs
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Connexion
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Commencer
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
          <p>
            © {new Date().getFullYear()} MyDueGuard. MyDueGuard n&apos;encaisse
            jamais vos paiements.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/pricing" className="hover:text-foreground">
            Tarifs
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Conditions
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
          L&apos;assistant de paiement des indépendants
        </span>
        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Déposez votre facture impayée. MyDueGuard s&apos;occupe du reste.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Freelance, consultant, artisan ou prestataire : MyDueGuard analyse
          votre dossier, contacte votre client, suit les échanges et vous
          accompagne automatiquement jusqu&apos;à la résolution du paiement.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "brand", size: "lg" }),
              "font-semibold",
            )}
          >
            Confier une facture
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "font-semibold",
            )}
          >
            Voir les tarifs
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Vous n&apos;avez plus à passer vos journées à relancer les services
          comptables. Votre client vous règle directement sur votre compte.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- how it works ------------------------------ */

const STEPS = [
  {
    icon: Upload,
    title: "Déposez votre facture",
    body: "Ajoutez la facture impayée et vos justificatifs dans un espace privé et sécurisé.",
  },
  {
    icon: Sparkles,
    title: "MyDueGuard analyse",
    body: "L'IA lit vos documents, vérifie la complétude du dossier et prépare le premier contact.",
  },
  {
    icon: Mail,
    title: "Votre client est contacté",
    body: "MyDueGuard écrit à votre client, suit les réponses et relance automatiquement.",
  },
  {
    icon: CheckCircle2,
    title: "Vous êtes payé, on clôture",
    body: "Dès la promesse de paiement, MyDueGuard suit l'échéance jusqu'au règlement — sur votre compte.",
  },
];

function HowItWorks() {
  return (
    <Section
      id="how"
      title="Comment ça marche"
      subtitle="Du dépôt à la résolution, en quatre étapes."
    >
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
  { icon: Clock, label: "Factures en retard" },
  { icon: FileText, label: "Impayés clients" },
  { icon: Mail, label: "Relances chronophages" },
  { icon: ListChecks, label: "Justificatifs demandés" },
  { icon: CalendarClock, label: "Promesses non tenues" },
];

function HelpsWith() {
  return (
    <Section
      title="Ce que MyDueGuard prend en charge"
      subtitle="Le suivi administratif de vos paiements en attente, de bout en bout."
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

/* --------------------------------- for who --------------------------------- */

const AUDIENCE = [
  { icon: Sparkles, label: "Développeurs & designers" },
  { icon: UserCheck, label: "Consultants & coachs" },
  { icon: FileText, label: "Rédacteurs & créatifs" },
  { icon: Building2, label: "Artisans & prestataires" },
  { icon: Landmark, label: "Sous-traitants & freelances" },
];

function ForWho() {
  return (
    <Section
      title="Pour qui"
      subtitle="Conçu pour tous les indépendants confrontés à des factures impayées, quel que soit leur métier."
    >
      <div className="flex flex-wrap justify-center gap-3">
        {AUDIENCE.map(({ icon: Icon, label }) => (
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
    title: "Analyse automatique",
    body: "Extraction des informations clés de votre facture et score de complétude du dossier.",
  },
  {
    icon: Mail,
    title: "Contact & relances",
    body: "Emails professionnels et factuels, relances programmées, sans jamais spammer.",
  },
  {
    icon: CalendarClock,
    title: "Suivi des promesses",
    body: "Une date de paiement annoncée ? MyDueGuard la détecte et vérifie l'échéance.",
  },
  {
    icon: Bell,
    title: "Vous restez informé",
    body: "Notifications aux moments qui comptent : contact, réponse, promesse, règlement.",
  },
  {
    icon: UserCheck,
    title: "Intervention humaine",
    body: "En cas de litige ou de situation sensible, un humain reprend la main.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurisé & privé",
    body: "Vos documents sont isolés à votre compte, avec des contrôles d'accès stricts.",
  },
];

function WhyChoose() {
  return (
    <Section
      title="Pourquoi MyDueGuard"
      subtitle="Un vrai système automatisé, pas un simple chatbot."
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
      title="Des offres pour chaque volume"
      subtitle="Commencez petit, montez en puissance quand vos dossiers se multiplient. Sans engagement."
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
              {plan.highlighted && <Badge variant="info">Populaire</Badge>}
            </div>
            <p className="mt-2 text-2xl font-bold">
              {plan.priceMonthly}€
              <span className="text-sm font-normal text-muted-foreground">
                /mois
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
              Choisir {plan.name}
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/pricing"
          className="text-sm font-medium text-brand hover:underline"
        >
          Comparer toutes les fonctionnalités →
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
          Prêt à confier votre première facture ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Déposez votre facture impayée et laissez MyDueGuard gérer le suivi
          jusqu&apos;au règlement.
        </p>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
            "mt-6 font-semibold",
          )}
        >
          Confier une facture
          <ArrowRight className="size-4" />
        </Link>
        <p className="mx-auto mt-6 max-w-2xl text-sm text-primary-foreground/80">
          MyDueGuard assure le suivi administratif de vos factures. MyDueGuard
          n&apos;encaisse jamais vos paiements et n&apos;est ni un huissier ni un
          cabinet juridique.
        </p>
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
