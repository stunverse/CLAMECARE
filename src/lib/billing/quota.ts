import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_BY_ID, type PlanQuota } from "@/lib/billing/plans";
import type { SubscriptionPlan } from "@/lib/types/enums";

export type QuotaKind = "ai_analysis" | "generated_document" | "document_upload";

const FIELD: Record<QuotaKind, keyof PlanQuota> = {
  ai_analysis: "ai_analysis_limit",
  generated_document: "generated_documents_limit",
  document_upload: "documents_limit",
};

const EVENTS: Record<QuotaKind, string[]> = {
  ai_analysis: ["ai_analysis"],
  generated_document: ["document_generated", "complaint_generated"],
  document_upload: ["document_uploaded"],
};

export const LIMIT_MESSAGE: Record<QuotaKind, string> = {
  ai_analysis: "You've reached your plan's monthly AI usage limit.",
  generated_document:
    "You've reached your plan's monthly document generation limit.",
  document_upload: "You've reached your plan's monthly upload limit.",
};

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1),
  ).toISOString();
}

/** The user's effective quota: usage_limits row, else the plan default. */
async function effectiveQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanQuota> {
  const { data: limits } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<PlanQuota>();
  if (limits) {
    return {
      active_claims_limit: limits.active_claims_limit,
      documents_limit: limits.documents_limit,
      ai_analysis_limit: limits.ai_analysis_limit,
      generated_documents_limit: limits.generated_documents_limit,
      storage_limit_mb: limits.storage_limit_mb,
      expert_reviews_limit: limits.expert_reviews_limit,
    };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", userId)
    .maybeSingle<{ plan_name: SubscriptionPlan | null; status: string }>();
  const plan: SubscriptionPlan =
    sub?.status === "active" || sub?.status === "trialing"
      ? (sub.plan_name ?? "starter")
      : "starter";
  return PLAN_BY_ID[plan].quota;
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
}

/** Check whether the user can perform one more action of `kind` this month. */
export async function checkQuota(
  supabase: SupabaseClient,
  userId: string,
  kind: QuotaKind,
): Promise<QuotaCheck> {
  const quota = await effectiveQuota(supabase, userId);
  const limit = quota[FIELD[kind]];
  if (limit === null || limit === undefined) {
    return { allowed: true, used: 0, limit: null };
  }

  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event_type", EVENTS[kind])
    .gte("created_at", startOfMonthISO());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

/* ----------------------------- rate limiting ----------------------------- */

const RATE_LIMIT = 12; // AI actions
const RATE_WINDOW_MS = 60_000; // per minute

export const RATE_LIMIT_MESSAGE =
  "You're doing that a bit too fast. Please wait a moment and try again.";

/**
 * Simple DB-backed rate limit: caps AI actions per user per minute. Works
 * across serverless instances since it counts persisted usage_events.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return (count ?? 0) < RATE_LIMIT;
}
