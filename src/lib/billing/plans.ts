import type { SubscriptionPlan } from "@/lib/types/enums";

export interface PlanQuota {
  /** null = unlimited */
  active_claims_limit: number | null;
  documents_limit: number | null;
  ai_analysis_limit: number | null;
  generated_documents_limit: number | null;
  storage_limit_mb: number | null;
  expert_reviews_limit: number | null;
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number; // 2 months free (monthly * 10)
  features: string[];
  quota: PlanQuota;
  priceIds: { monthly?: string; yearly?: string };
  highlighted?: boolean;
}

const price = (k: string) => process.env[k] || undefined;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Pour démarrer le suivi de vos impayés.",
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      "1 dossier actif",
      "Analyse IA du dossier",
      "Relances automatiques",
      "Suivi des paiements",
      "Coffre de documents",
      "Score de complétude",
    ],
    quota: {
      active_claims_limit: 1,
      documents_limit: 10,
      ai_analysis_limit: 5,
      generated_documents_limit: 3,
      storage_limit_mb: 100,
      expert_reviews_limit: 0,
    },
    priceIds: {
      monthly: price("STRIPE_PRICE_STARTER_MONTHLY"),
      yearly: price("STRIPE_PRICE_STARTER_YEARLY"),
    },
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Pour gérer plusieurs impayés en parallèle.",
    priceMonthly: 79,
    priceYearly: 790,
    features: [
      "5 dossiers actifs",
      "Analyse IA complète",
      "Relances & suivi automatiques",
      "Détection des promesses de paiement",
      "Historique & échanges centralisés",
      "Emails générés & personnalisables",
      "Intervention humaine sur demande",
      "Exports PDF",
    ],
    quota: {
      active_claims_limit: 5,
      documents_limit: 50,
      ai_analysis_limit: 50,
      generated_documents_limit: 20,
      storage_limit_mb: 500,
      expert_reviews_limit: 0,
    },
    priceIds: {
      monthly: price("STRIPE_PRICE_PLUS_MONTHLY"),
      yearly: price("STRIPE_PRICE_PLUS_YEARLY"),
    },
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour un volume de dossiers et un accompagnement avancé.",
    priceMonthly: 199,
    priceYearly: 1990,
    features: [
      "20 dossiers actifs",
      "Tout de la formule Plus",
      "Mise en demeure amiable",
      "Annuaire clients & analytics",
      "Support prioritaire",
      "Intervention humaine sur demande",
    ],
    quota: {
      active_claims_limit: 20,
      documents_limit: 200,
      ai_analysis_limit: 200,
      generated_documents_limit: 100,
      storage_limit_mb: 2000,
      expert_reviews_limit: 0,
    },
    priceIds: {
      monthly: price("STRIPE_PRICE_PRO_MONTHLY"),
      yearly: price("STRIPE_PRICE_PRO_YEARLY"),
    },
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Pour les gros volumes et un accompagnement dédié.",
    priceMonthly: 399,
    priceYearly: 3990,
    features: [
      "Dossiers en volume",
      "Intervention humaine incluse",
      "Traitement prioritaire",
      "Accompagnement dédié",
      "Règles d'automatisation avancées",
      "Support premium",
    ],
    quota: {
      active_claims_limit: 100,
      documents_limit: null,
      ai_analysis_limit: null,
      generated_documents_limit: null,
      storage_limit_mb: 10000,
      expert_reviews_limit: 3,
    },
    priceIds: {
      monthly: price("STRIPE_PRICE_PREMIUM_MONTHLY"),
      yearly: price("STRIPE_PRICE_PREMIUM_YEARLY"),
    },
  },
];

export const PLAN_BY_ID: Record<SubscriptionPlan, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
) as Record<SubscriptionPlan, Plan>;

/** Reverse lookup: Stripe price id -> { plan, interval }. */
export function planFromPriceId(
  priceId: string,
): { plan: SubscriptionPlan; interval: "monthly" | "yearly" } | null {
  for (const p of PLANS) {
    if (p.priceIds.monthly === priceId)
      return { plan: p.id, interval: "monthly" };
    if (p.priceIds.yearly === priceId)
      return { plan: p.id, interval: "yearly" };
  }
  return null;
}

/** Default quota for users without a paid subscription (free baseline). */
export const FREE_QUOTA: PlanQuota = PLAN_BY_ID.starter.quota;
