#!/usr/bin/env node
/**
 * MyDueGuard — Stripe products & prices bootstrap.
 *
 * Creates (idempotently) one product per subscription plan and per one-time
 * add-on, with prices in EUR, then prints the exact environment variables to
 * paste into Vercel. Re-running reuses existing prices (matched by lookup_key),
 * so it is safe to run twice.
 *
 * Usage (test mode first!):
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.mjs
 *
 * Switch to live later by re-running with your live secret key:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/stripe-setup.mjs
 *
 * No dependencies — talks to the Stripe REST API with fetch (Node 18+).
 */

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error(
    "\n✗ STRIPE_SECRET_KEY manquant.\n" +
      "  Lance :  STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.mjs\n",
  );
  process.exit(1);
}
const MODE = KEY.startsWith("sk_live") ? "LIVE" : "TEST";
const CURRENCY = "eur";

/** Subscription plans — amounts in cents. Yearly = 10× monthly (2 mois offerts). */
const PLANS = [
  {
    key: "starter",
    name: "MyDueGuard Starter",
    description: "Pour démarrer le suivi de vos impayés.",
    monthly: 2900,
    yearly: 29000,
    env: {
      monthly: "STRIPE_PRICE_STARTER_MONTHLY",
      yearly: "STRIPE_PRICE_STARTER_YEARLY",
    },
  },
  {
    key: "plus",
    name: "MyDueGuard Plus",
    description: "Pour gérer plusieurs impayés en parallèle.",
    monthly: 7900,
    yearly: 79000,
    env: {
      monthly: "STRIPE_PRICE_PLUS_MONTHLY",
      yearly: "STRIPE_PRICE_PLUS_YEARLY",
    },
  },
  {
    key: "pro",
    name: "MyDueGuard Pro",
    description: "Pour un volume de dossiers et un accompagnement avancé.",
    monthly: 19900,
    yearly: 199000,
    env: {
      monthly: "STRIPE_PRICE_PRO_MONTHLY",
      yearly: "STRIPE_PRICE_PRO_YEARLY",
    },
  },
  {
    key: "premium",
    name: "MyDueGuard Premium",
    description: "Pour les gros volumes et un accompagnement dédié.",
    monthly: 39900,
    yearly: 399000,
    env: {
      monthly: "STRIPE_PRICE_PREMIUM_MONTHLY",
      yearly: "STRIPE_PRICE_PREMIUM_YEARLY",
    },
  },
];

/** One-time add-ons — amounts in cents. */
const ADDONS = [
  {
    key: "addon_expert_review",
    name: "MyDueGuard — Revue humaine",
    description: "Un membre de l'équipe reprend votre dossier en main.",
    amount: 19900,
    env: "STRIPE_PRICE_ADDON_EXPERT_REVIEW",
  },
  {
    key: "addon_claim_packet",
    name: "MyDueGuard — Dossier complet PDF",
    description: "Un dossier PDF soigné, prêt à transmettre.",
    amount: 4900,
    env: "STRIPE_PRICE_ADDON_CLAIM_PACKET",
  },
  {
    key: "addon_urgent_analysis",
    name: "MyDueGuard — Analyse prioritaire",
    description: "Analyse IA en priorité pour un dossier urgent.",
    amount: 4900,
    env: "STRIPE_PRICE_ADDON_URGENT_ANALYSIS",
  },
  {
    key: "addon_attorney_packet",
    name: "MyDueGuard — Dossier pour avocat",
    description: "Un récapitulatif complet, prêt pour une consultation d'avocat.",
    amount: 9900,
    env: "STRIPE_PRICE_ADDON_ATTORNEY_PACKET",
  },
];

const API = "https://api.stripe.com/v1";

function encode(obj, prefix = "") {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      parts.push(encode(v, key));
    } else if (Array.isArray(v)) {
      v.forEach((item) => parts.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(item)}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}

async function stripe(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? encode(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `Stripe ${method} ${path} → ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`,
    );
  }
  return json;
}

/** Find an existing active price by its lookup_key (returns {id, product} or null). */
async function findPriceByLookupKey(lookupKey) {
  const q = `/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true&limit=1`;
  const res = await stripe("GET", q);
  const price = res.data?.[0];
  return price ? { id: price.id, product: price.product } : null;
}

async function ensureProduct(name, description, metadata) {
  const product = await stripe("POST", "/products", { name, description, metadata });
  return product.id;
}

async function ensurePrice({ lookupKey, productId, unitAmount, interval, nickname }) {
  const existing = await findPriceByLookupKey(lookupKey);
  if (existing) {
    console.log(`  · ${lookupKey} déjà présent (${existing.id})`);
    return existing.id;
  }
  const body = {
    currency: CURRENCY,
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    nickname,
    product: productId,
    tax_behavior: "inclusive",
  };
  if (interval) body.recurring = { interval };
  const price = await stripe("POST", "/prices", body);
  console.log(`  ✓ ${lookupKey} créé (${price.id})`);
  return price.id;
}

async function main() {
  console.log(`\n▶ Configuration Stripe MyDueGuard — mode ${MODE}\n`);
  const out = {};

  for (const plan of PLANS) {
    console.log(`Formule ${plan.name}`);
    const monthlyKey = `mdg_${plan.key}_monthly`;
    const yearlyKey = `mdg_${plan.key}_yearly`;

    // Reuse the product of an already-created price if any, else create one.
    let productId =
      (await findPriceByLookupKey(monthlyKey))?.product ??
      (await findPriceByLookupKey(yearlyKey))?.product ??
      null;
    if (!productId) {
      productId = await ensureProduct(plan.name, plan.description, {
        mdg_plan: plan.key,
      });
    }

    out[plan.env.monthly] = await ensurePrice({
      lookupKey: monthlyKey,
      productId,
      unitAmount: plan.monthly,
      interval: "month",
      nickname: `${plan.name} — mensuel`,
    });
    out[plan.env.yearly] = await ensurePrice({
      lookupKey: yearlyKey,
      productId,
      unitAmount: plan.yearly,
      interval: "year",
      nickname: `${plan.name} — annuel`,
    });
  }

  for (const addon of ADDONS) {
    console.log(`Option ${addon.name}`);
    const lookupKey = `mdg_${addon.key}`;
    let productId = (await findPriceByLookupKey(lookupKey))?.product ?? null;
    if (!productId) {
      productId = await ensureProduct(addon.name, addon.description, {
        mdg_addon: addon.key,
      });
    }
    out[addon.env] = await ensurePrice({
      lookupKey,
      productId,
      unitAmount: addon.amount,
      interval: null,
      nickname: addon.name,
    });
  }

  console.log(
    `\n────────────────────────────────────────────────────────────\n` +
      `✅ Terminé (mode ${MODE}). Copie ces variables dans Vercel :\n` +
      `────────────────────────────────────────────────────────────\n`,
  );
  for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
  console.log(
    `\n(Puis ajoute aussi STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\n` +
      ` et STRIPE_WEBHOOK_SECRET — voir les étapes fournies.)\n`,
  );
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
