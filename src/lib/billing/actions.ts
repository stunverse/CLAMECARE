"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { PLAN_BY_ID } from "@/lib/billing/plans";
import type { SubscriptionPlan } from "@/lib/types/enums";

export async function createCheckoutSession(input: {
  plan: SubscriptionPlan;
  interval: "monthly" | "yearly";
}): Promise<{ error?: string }> {
  if (!stripe) return { error: "Billing is not connected yet." };

  const supabase = await createClient();
  if (!supabase) return { error: "Billing is not connected yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/pricing");

  const plan = PLAN_BY_ID[input.plan];
  const priceId =
    input.interval === "yearly" ? plan.priceIds.yearly : plan.priceIds.monthly;
  if (!priceId) {
    return { error: "This plan is not available for checkout yet." };
  }

  // Reuse an existing Stripe customer if we have one.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/billing?success=1`,
    cancel_url: `${env.APP_URL}/pricing`,
    client_reference_id: user.id,
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : (user.email ?? undefined),
    metadata: { user_id: user.id, plan: input.plan },
    subscription_data: { metadata: { user_id: user.id, plan: input.plan } },
    allow_promotion_codes: true,
  });

  if (!session.url) return { error: "Could not start checkout." };
  redirect(session.url);
}

export async function createPortalSession(): Promise<{ error?: string }> {
  if (!stripe) return { error: "Billing is not connected yet." };

  const supabase = await createClient();
  if (!supabase) return { error: "Billing is not connected yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/billing");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (!sub?.stripe_customer_id) {
    return { error: "You don't have a billing account yet." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${env.APP_URL}/billing`,
  });

  redirect(session.url);
}
