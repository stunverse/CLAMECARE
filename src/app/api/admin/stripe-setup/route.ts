import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { PLANS } from "@/lib/billing/plans";
import { ADDONS } from "@/lib/billing/addons";

/**
 * One-shot Stripe catalog bootstrap — browser-friendly (no terminal needed).
 *
 * Visiting `/api/admin/stripe-setup?key=<CRON_SECRET>` creates (idempotently,
 * matched by lookup_key) one product per plan and per add-on with EUR prices,
 * then returns the exact env vars to paste into Vercel.
 *
 * Guarded by CRON_SECRET. It only writes to the Stripe product catalog (no
 * charges, no customer data). Safe to hit twice — existing prices are reused.
 */

export const runtime = "nodejs";

function planEnvNames(id: string) {
  const up = id.toUpperCase();
  return {
    monthly: `STRIPE_PRICE_${up}_MONTHLY`,
    yearly: `STRIPE_PRICE_${up}_YEARLY`,
  };
}

function addonEnvName(id: string) {
  return `STRIPE_PRICE_ADDON_${id.toUpperCase()}`;
}

async function findPrice(
  s: Stripe,
  lookupKey: string,
): Promise<Stripe.Price | null> {
  const res = await s.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });
  return res.data[0] ?? null;
}

async function ensurePrice(
  s: Stripe,
  opts: {
    lookupKey: string;
    productId: string;
    unitAmount: number;
    interval?: "month" | "year";
    nickname: string;
  },
): Promise<string> {
  const existing = await findPrice(s, opts.lookupKey);
  if (existing) return existing.id;
  const price = await s.prices.create({
    currency: "eur",
    unit_amount: opts.unitAmount,
    lookup_key: opts.lookupKey,
    nickname: opts.nickname,
    product: opts.productId,
    tax_behavior: "inclusive",
    ...(opts.interval ? { recurring: { interval: opts.interval } } : {}),
  });
  return price.id;
}

async function productIdFor(
  s: Stripe,
  lookupKeys: string[],
  create: () => Promise<string>,
): Promise<string> {
  for (const k of lookupKeys) {
    const p = await findPrice(s, k);
    const prod = p?.product;
    if (prod) return typeof prod === "string" ? prod : prod.id;
  }
  return create();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!env.CRON_SECRET || key !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Diagnostic mode: report which env vars the running deployment actually sees
  // (values are never returned — only present/absent). Use ?check=1.
  if (searchParams.get("check")) {
    const names = [
      "STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_APP_URL",
      ...PLANS.flatMap((p) => {
        const up = p.id.toUpperCase();
        return [`STRIPE_PRICE_${up}_MONTHLY`, `STRIPE_PRICE_${up}_YEARLY`];
      }),
      ...ADDONS.map((a) => `STRIPE_PRICE_ADDON_${a.id.toUpperCase()}`),
    ];
    const present: Record<string, boolean> = {};
    for (const n of names) present[n] = Boolean(process.env[n]);
    return NextResponse.json(
      { mode: "check", present },
      { status: 200 },
    );
  }

  const s = stripe;
  if (!s) {
    return NextResponse.json(
      {
        error:
          "Stripe non configuré. Ajoute d'abord STRIPE_SECRET_KEY sur Vercel puis redéploie.",
      },
      { status: 400 },
    );
  }

  const mode = env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE" : "TEST";
  const out: Record<string, string> = {};

  try {
    for (const plan of PLANS) {
      const monthlyKey = `mdg_${plan.id}_monthly`;
      const yearlyKey = `mdg_${plan.id}_yearly`;
      const productId = await productIdFor(s, [monthlyKey, yearlyKey], () =>
        s.products
          .create({
            name: `MyDueGuard ${plan.name}`,
            description: plan.tagline,
            metadata: { mdg_plan: plan.id },
          })
          .then((p) => p.id),
      );
      const envNames = planEnvNames(plan.id);
      out[envNames.monthly] = await ensurePrice(s, {
        lookupKey: monthlyKey,
        productId,
        unitAmount: plan.priceMonthly * 100,
        interval: "month",
        nickname: `MyDueGuard ${plan.name} — mensuel`,
      });
      out[envNames.yearly] = await ensurePrice(s, {
        lookupKey: yearlyKey,
        productId,
        unitAmount: plan.priceYearly * 100,
        interval: "year",
        nickname: `MyDueGuard ${plan.name} — annuel`,
      });
    }

    for (const addon of ADDONS) {
      const lookupKey = `mdg_addon_${addon.id}`;
      const productId = await productIdFor(s, [lookupKey], () =>
        s.products
          .create({
            name: `MyDueGuard — ${addon.name}`,
            description: addon.description,
            metadata: { mdg_addon: addon.id },
          })
          .then((p) => p.id),
      );
      out[addonEnvName(addon.id)] = await ensurePrice(s, {
        lookupKey,
        productId,
        unitAmount: addon.price * 100,
        nickname: `MyDueGuard — ${addon.name}`,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  const envBlock = Object.entries(out)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  return new NextResponse(
    `✅ Catalogue Stripe créé (mode ${mode}).\n\n` +
      `Copie ces variables dans Vercel (Production), puis redéploie :\n\n` +
      `${envBlock}\n`,
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
