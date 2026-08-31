import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
  Mail,
  Bell,
  CheckCircle2,
  CalendarClock,
  Landmark,
  UserCheck,
  Building2,
  Lock,
  Cpu,
  Radar,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { PLANS } from "@/lib/billing/plans";
import { BrandLogo } from "@/components/brand-logo";
import { Reveal } from "@/components/landing/reveal";
import { Counter } from "@/components/landing/counter";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="mdg-dark flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <Stats />
        <HowItWorks />
        <WhyChoose />
        <ForWho />
        <PricingTeaser />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------- header/footer ----------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center">
          <BrandLogo className="text-2xl" />
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/pricing"
            className="hidden rounded-lg px-3 py-2 font-medium text-slate-300 transition-colors hover:text-white sm:block"
          >
            Tarifs
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 font-medium text-slate-300 transition-colors hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="mdg-cta rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 font-semibold text-[#05070f] shadow-[0_0_24px_-4px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.03]"
          >
            Commencer
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#05070f]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <BrandLogo className="text-xl" />
          <p>
            © {new Date().getFullYear()} MyDueGuard. Suivi amiable — jamais
            d&apos;encaissement.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5">
          <Link href="/pricing" className="hover:text-white">
            Tarifs
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-white">
            Conditions
          </Link>
          <Link href="/disclaimer" className="hover:text-white">
            Mentions
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="mdg-hero relative overflow-hidden">
      <div className="mdg-aurora" aria-hidden />
      <div className="mdg-grid" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <span className="mdg-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-200">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
            </span>
            Recouvrement amiable, automatisé par l&apos;IA
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            <span className="mdg-text-gradient">Vos impayés,</span>
            <br />
            réglés en pilote automatique.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-slate-300 lg:mx-0">
            Déposez une facture impayée. MyDueGuard l&apos;analyse, contacte
            votre client, relance, détecte les promesses de paiement et vous
            tient informé — jusqu&apos;au règlement, <strong className="text-white">directement
            sur votre compte</strong>.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link
              href="/signup"
              className="mdg-cta inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3.5 text-base font-semibold text-[#05070f] shadow-[0_0_40px_-6px_rgba(59,130,246,0.8)] transition-transform hover:scale-[1.03]"
            >
              Confier une facture
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
            >
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 lg:justify-start">
            <TrustChip icon={Lock} label="Documents chiffrés & isolés" />
            <TrustChip icon={ShieldCheck} label="Jamais d'encaissement" />
            <TrustChip icon={BadgeCheck} label="100 % conforme" />
          </div>
        </div>

        {/* Live case card */}
        <Reveal className="lg:justify-self-end">
          <LiveCaseCard />
        </Reveal>
      </div>
    </section>
  );
}

function TrustChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 text-cyan-400" />
      {label}
    </span>
  );
}

const PIPELINE = [
  { label: "Facture", done: true },
  { label: "Analyse IA", done: true },
  { label: "Contact", done: true },
  { label: "Relances", active: true },
  { label: "Payé", done: false },
];

function LiveCaseCard() {
  return (
    <div className="mdg-float mdg-ring relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <BrandSymbolDot />
          Suivi en direct
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Actif
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs text-slate-400">
            CG-2026-000142
          </span>
          <span className="text-lg font-bold text-white">3 200,00 €</span>
        </div>

        {/* pipeline */}
        <div className="relative mt-5">
          <div className="absolute left-0 right-0 top-[7px] h-px bg-white/10" />
          <div className="absolute left-0 top-[7px] h-px w-[62%] bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="relative flex justify-between">
            {PIPELINE.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "size-3.5 rounded-full border-2",
                    s.done && "border-cyan-400 bg-cyan-400",
                    s.active && "mdg-node border-blue-400 bg-blue-500",
                    !s.done && !s.active && "border-white/20 bg-transparent",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px]",
                    s.active ? "font-semibold text-white" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* timeline feed */}
      <div className="mt-4 space-y-2">
        <FeedRow
          delay={0.2}
          icon={Mail}
          text="Premier contact envoyé"
          time="09:02"
        />
        <FeedRow
          delay={0.5}
          icon={Radar}
          text="Réponse du client analysée"
          time="14:37"
        />
        <FeedRow
          delay={0.8}
          icon={CalendarClock}
          text="Paiement promis · 15 sept."
          time="14:38"
          accent
        />
      </div>
    </div>
  );
}

function FeedRow({
  icon: Icon,
  text,
  time,
  delay,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  time: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <div
      className="mdg-rise flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
      style={{ animationDelay: `${delay}s` }}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          accent ? "bg-cyan-400/15 text-cyan-300" : "bg-white/5 text-slate-300",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="flex-1 text-xs text-slate-200">{text}</span>
      <span className="font-mono text-[10px] text-slate-500">{time}</span>
    </div>
  );
}

function BrandSymbolDot() {
  return (
    <span className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
      <ShieldCheck className="size-3" />
    </span>
  );
}

/* ------------------------------- trust bar --------------------------------- */

const TRUST = [
  "Freelances",
  "Consultants",
  "Agences",
  "Artisans",
  "Studios",
  "Développeurs",
  "Designers",
  "Sous-traitants",
];

function TrustBar() {
  return (
    <div className="border-y border-white/10 bg-white/[0.02] py-5">
      <div className="relative mx-auto flex w-full max-w-6xl overflow-hidden px-6 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div className="mdg-marquee flex shrink-0 items-center gap-10 pr-10 text-sm font-medium text-slate-500">
          {[...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
              <BadgeCheck className="size-4 text-blue-400/70" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- stats ----------------------------------- */

function Stats() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={<Counter to={100} suffix=" %" />} label="Automatisé de bout en bout" />
        <StatCard value={<Counter to={24} suffix="/7" />} label="Suivi en continu" />
        <StatCard value={<Counter to={3} />} label="Relances, puis revue humaine" />
        <StatCard value={<span>0 €</span>} label="Jamais encaissé par nous" />
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Reveal className="mdg-glass rounded-2xl p-6 text-center">
      <div className="text-4xl font-extrabold tracking-tight text-white">
        {value}
      </div>
      <div className="mt-1.5 text-sm text-slate-400">{label}</div>
    </Reveal>
  );
}

/* ------------------------------- how it works ------------------------------ */

const STEPS = [
  {
    icon: Upload,
    title: "Déposez votre facture",
    body: "Ajoutez la facture impayée et vos justificatifs dans un espace privé et chiffré.",
  },
  {
    icon: Cpu,
    title: "L'IA analyse",
    body: "Extraction des informations clés, score de complétude, préparation du premier contact.",
  },
  {
    icon: Mail,
    title: "Votre client est contacté",
    body: "Emails professionnels, suivi des réponses et relances programmées — sans jamais spammer.",
  },
  {
    icon: CheckCircle2,
    title: "Vous êtes payé",
    body: "Promesse détectée, échéance suivie, règlement confirmé — sur votre compte, jamais le nôtre.",
  },
];

function HowItWorks() {
  return (
    <Section
      eyebrow="Le parcours"
      title="Du dépôt au règlement, sans lever le petit doigt"
      subtitle="Un vrai système automatisé, pas un simple chatbot."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 90}>
            <div className="mdg-glass group relative h-full rounded-2xl p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 text-cyan-300 ring-1 ring-white/10">
                <Icon className="size-5" />
              </span>
              <span className="absolute right-5 top-5 font-mono text-sm font-bold text-white/15">
                0{i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- why choose -------------------------------- */

const REASONS = [
  {
    icon: Sparkles,
    title: "Analyse intelligente",
    body: "L'IA lit vos documents et structure le dossier. Elle ne décide rien : le code fixe les dates, montants et états.",
  },
  {
    icon: Zap,
    title: "Contact & relances auto",
    body: "Premier contact immédiat, relances à J+3, J+7, J+14, en horaires ouvrés. Zéro action de votre part.",
  },
  {
    icon: CalendarClock,
    title: "Détection des promesses",
    body: "Une date de paiement annoncée ? Elle est détectée, le suivi s'ajuste et l'échéance est vérifiée.",
  },
  {
    icon: Bell,
    title: "Vous restez informé",
    body: "Notifications aux moments qui comptent : contact, réponse, promesse, règlement.",
  },
  {
    icon: UserCheck,
    title: "Revue humaine",
    body: "Litige ou situation sensible ? L'automatisation s'arrête et un humain reprend la main.",
  },
  {
    icon: ShieldCheck,
    title: "Cadre strict & sûr",
    body: "Suivi amiable uniquement. Ni huissier, ni cabinet juridique. Vos données isolées à votre compte.",
  },
];

function WhyChoose() {
  return (
    <Section
      eyebrow="La différence"
      title="Fiable, professionnel, sans effort"
      subtitle="Tout le suivi administratif de vos paiements en attente, orchestré automatiquement."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={(i % 3) * 90}>
            <div className="mdg-glass h-full rounded-2xl p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-blue-300 ring-1 ring-white/10">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{body}</p>
            </div>
          </Reveal>
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
      eyebrow="Pour qui"
      title="Pensé pour tous les indépendants"
      subtitle="Quel que soit votre métier, si un client vous doit de l'argent, MyDueGuard s'en occupe."
    >
      <div className="flex flex-wrap justify-center gap-3">
        {AUDIENCE.map(({ icon: Icon, label }, i) => (
          <Reveal key={label} delay={i * 70}>
            <div className="mdg-glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-slate-200">
              <Icon className="size-4 text-cyan-400" />
              {label}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------ pricing teaser ----------------------------- */

function PricingTeaser() {
  return (
    <Section
      eyebrow="Tarifs"
      title="Une formule pour chaque volume"
      subtitle="Commencez petit, montez en puissance. Sans engagement, résiliable à tout moment."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 80}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-2xl p-6",
                plan.highlighted
                  ? "mdg-ring border border-blue-400/40 bg-gradient-to-b from-blue-500/[0.12] to-white/[0.02]"
                  : "mdg-glass",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#05070f]">
                  Populaire
                </span>
              )}
              <h3 className="font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-3xl font-extrabold text-white">
                {plan.priceMonthly}
                <span className="text-lg"> €</span>
                <span className="text-sm font-normal text-slate-400">/mois</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className={cn(
                  "mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]",
                  plan.highlighted
                    ? "mdg-cta bg-gradient-to-r from-blue-500 to-cyan-400 text-[#05070f]"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                Choisir {plan.name}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
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
    <section className="px-6 py-20">
      <Reveal className="mx-auto max-w-4xl">
        <div className="mdg-hero relative overflow-hidden rounded-3xl border border-white/10 p-10 text-center md:p-14">
          <div className="mdg-aurora" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Confiez votre première facture aujourd&apos;hui
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Déposez-la, et laissez MyDueGuard gérer tout le suivi jusqu&apos;au
              règlement — pendant que vous vous concentrez sur votre métier.
            </p>
            <Link
              href="/signup"
              className="mdg-cta mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-4 text-base font-semibold text-[#05070f] shadow-[0_0_50px_-8px_rgba(59,130,246,0.9)] transition-transform hover:scale-[1.03]"
            >
              Confier une facture
              <ArrowRight className="size-4" />
            </Link>
            <p className="mx-auto mt-8 max-w-2xl text-xs text-slate-400">
              MyDueGuard assure le suivi administratif amiable de vos factures.
              MyDueGuard n&apos;encaisse jamais vos paiements et n&apos;est ni un
              huissier ni un cabinet juridique.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------- section shell ----------------------------- */

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="mb-10 text-center">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              {eyebrow}
            </span>
          )}
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">{subtitle}</p>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
