export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number; // one-time, USD
  priceId?: string; // Stripe Price ID (from env)
}

const price = (k: string) => process.env[k] || undefined;

/** One-time purchasable add-ons (cahier des charges §30). */
export const ADDONS: Addon[] = [
  {
    id: "expert_review",
    name: "Human expert review",
    description: "A specialist reviews your appeal, evidence, or strategy.",
    price: 199,
    priceId: price("STRIPE_PRICE_ADDON_EXPERT_REVIEW"),
  },
  {
    id: "claim_packet",
    name: "Full claim packet",
    description: "A polished, ready-to-send PDF packet of your entire claim.",
    price: 49,
    priceId: price("STRIPE_PRICE_ADDON_CLAIM_PACKET"),
  },
  {
    id: "urgent_analysis",
    name: "Urgent analysis",
    description: "Priority AI analysis for time-sensitive claims.",
    price: 49,
    priceId: price("STRIPE_PRICE_ADDON_URGENT_ANALYSIS"),
  },
  {
    id: "attorney_packet",
    name: "Attorney referral packet",
    description: "A complete summary prepared for an attorney consultation.",
    price: 99,
    priceId: price("STRIPE_PRICE_ADDON_ATTORNEY_PACKET"),
  },
];

export const ADDON_BY_ID: Record<string, Addon> = Object.fromEntries(
  ADDONS.map((a) => [a.id, a]),
);
