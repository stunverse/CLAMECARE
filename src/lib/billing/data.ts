import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/env";
import { PLAN_BY_ID, type PlanQuota } from "@/lib/billing/plans";
import { DEMO_CLAIMS } from "@/lib/data/demo";
import { isActiveClaim } from "@/lib/claim-actions";
import type { Subscription } from "@/lib/types";
import type { SubscriptionPlan } from "@/lib/types/enums";

export interface BillingData {
  isDemo: boolean;
  stripeConfigured: boolean;
  plan: SubscriptionPlan;
  subscription: Subscription | null;
  quota: PlanQuota;
  usage: { activeClaims: number; generatedDocuments: number };
}

function demoData(): BillingData {
  return {
    isDemo: true,
    stripeConfigured: isStripeConfigured,
    plan: "starter",
    subscription: null,
    quota: PLAN_BY_ID.starter.quota,
    usage: {
      activeClaims: DEMO_CLAIMS.filter((c) => isActiveClaim(c.current_status))
        .length,
      generatedDocuments: 2,
    },
  };
}

export async function getBillingData(): Promise<BillingData> {
  const supabase = await createClient();
  if (!supabase) return demoData();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return demoData();

  const [{ data: sub }, { data: limits }, { count: activeClaims }, { count: docs }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<Subscription>(),
      supabase
        .from("usage_limits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<PlanQuota & { plan_name: SubscriptionPlan }>(),
      supabase
        .from("claims")
        .select("id", { count: "exact", head: true })
        .not("current_status", "in", "(resolved,abandoned)"),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true }),
    ]);

  const plan: SubscriptionPlan =
    sub?.status === "active" || sub?.status === "trialing"
      ? (sub.plan_name ?? "starter")
      : "starter";

  const quota: PlanQuota = limits
    ? {
        active_claims_limit: limits.active_claims_limit,
        documents_limit: limits.documents_limit,
        ai_analysis_limit: limits.ai_analysis_limit,
        generated_documents_limit: limits.generated_documents_limit,
        storage_limit_mb: limits.storage_limit_mb,
        expert_reviews_limit: limits.expert_reviews_limit,
      }
    : PLAN_BY_ID[plan].quota;

  return {
    isDemo: false,
    stripeConfigured: isStripeConfigured,
    plan,
    subscription: sub ?? null,
    quota,
    usage: {
      activeClaims: activeClaims ?? 0,
      generatedDocuments: docs ?? 0,
    },
  };
}
