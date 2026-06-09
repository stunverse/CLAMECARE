import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_BY_ID, planFromPriceId } from "@/lib/billing/plans";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/types/enums";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
  paused: "paused",
  incomplete: "incomplete",
  incomplete_expired: "canceled",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  if (!admin) return;

  const userId = (sub.metadata?.user_id as string) || null;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id;
  const planInfo = priceId ? planFromPriceId(priceId) : null;
  const plan: SubscriptionPlan | null =
    planInfo?.plan ?? ((sub.metadata?.plan as SubscriptionPlan) || null);

  const anySub = sub as any;
  const periodStart =
    anySub.current_period_start ??
    sub.items.data[0]?.current_period_start ??
    null;
  const periodEnd =
    anySub.current_period_end ?? sub.items.data[0]?.current_period_end ?? null;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      plan_name: plan,
      status: STATUS_MAP[sub.status] ?? "incomplete",
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "user_id" },
  );

  if (plan) {
    await admin.from("usage_limits").upsert(
      { user_id: userId, plan_name: plan, ...PLAN_BY_ID[plan].quota },
      { onConflict: "user_id" },
    );
  }
}

export async function POST(req: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          // Carry the user id from the checkout session if needed.
          if (!sub.metadata?.user_id && session.metadata?.user_id) {
            sub.metadata = { ...sub.metadata, ...session.metadata };
          }
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const admin = createAdminClient();
        if (admin && invoice.customer) {
          const { data: row } = await admin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", invoice.customer as string)
            .maybeSingle<{ user_id: string }>();
          if (row?.user_id) {
            await admin.from("notifications").insert({
              user_id: row.user_id,
              type: "payment_failed",
              title: "Payment failed",
              message:
                "We couldn't process your latest payment. Please update your payment method to keep your plan active.",
              action_url: "/billing",
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Handler error: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
