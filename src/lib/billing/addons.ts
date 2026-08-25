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
    name: "Revue humaine",
    description: "Un membre de l'équipe reprend votre dossier en main.",
    price: 199,
    priceId: price("STRIPE_PRICE_ADDON_EXPERT_REVIEW"),
  },
  {
    id: "claim_packet",
    name: "Dossier complet PDF",
    description: "Un dossier PDF soigné, prêt à transmettre.",
    price: 49,
    priceId: price("STRIPE_PRICE_ADDON_CLAIM_PACKET"),
  },
  {
    id: "urgent_analysis",
    name: "Analyse prioritaire",
    description: "Analyse IA en priorité pour un dossier urgent.",
    price: 49,
    priceId: price("STRIPE_PRICE_ADDON_URGENT_ANALYSIS"),
  },
  {
    id: "attorney_packet",
    name: "Dossier pour avocat",
    description: "Un récapitulatif complet, prêt pour une consultation d'avocat.",
    price: 99,
    priceId: price("STRIPE_PRICE_ADDON_ATTORNEY_PACKET"),
  },
];

export const ADDON_BY_ID: Record<string, Addon> = Object.fromEntries(
  ADDONS.map((a) => [a.id, a]),
);
