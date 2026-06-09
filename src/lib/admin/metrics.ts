import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_BY_ID } from "@/lib/billing/plans";
import type { SubscriptionPlan } from "@/lib/types/enums";

export interface AdminMetrics {
  totalUsers: number;
  paidUsers: number;
  claimsCreated: number;
  documentsUploaded: number;
  lettersGenerated: number;
  aiAnalyses: number;
  mrr: number;
}

const DEMO_METRICS: AdminMetrics = {
  totalUsers: 128,
  paidUsers: 34,
  claimsCreated: 211,
  documentsUploaded: 642,
  lettersGenerated: 173,
  aiAnalyses: 256,
  mrr: 3920,
};

const count = async (q: PromiseLike<{ count: number | null }>) =>
  (await q).count ?? 0;

export async function getAdminMetrics(
  supabase: SupabaseClient | null,
): Promise<AdminMetrics> {
  if (!supabase) return DEMO_METRICS;

  const [
    totalUsers,
    claimsCreated,
    documentsUploaded,
    lettersGenerated,
    aiAnalyses,
    { data: subs },
  ] = await Promise.all([
    count(
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ),
    count(supabase.from("claims").select("id", { count: "exact", head: true })),
    count(
      supabase
        .from("claim_documents")
        .select("id", { count: "exact", head: true }),
    ),
    count(
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true }),
    ),
    count(
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "ai_analysis"),
    ),
    supabase
      .from("subscriptions")
      .select("plan_name, status")
      .in("status", ["active", "trialing"])
      .returns<{ plan_name: SubscriptionPlan | null; status: string }[]>(),
  ]);

  const activeSubs = subs ?? [];
  const mrr = activeSubs.reduce(
    (sum, s) => sum + (s.plan_name ? PLAN_BY_ID[s.plan_name].priceMonthly : 0),
    0,
  );

  return {
    totalUsers,
    paidUsers: activeSubs.length,
    claimsCreated,
    documentsUploaded,
    lettersGenerated,
    aiAnalyses,
    mrr,
  };
}
