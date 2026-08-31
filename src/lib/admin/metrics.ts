import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_BY_ID } from "@/lib/billing/plans";
import type { SubscriptionPlan } from "@/lib/types/enums";

export interface AdminMetrics {
  totalUsers: number;
  paidUsers: number;
  casesCreated: number;
  documentsUploaded: number;
  emailsSent: number;
  toReview: number;
  amountRecovered: number;
  mrr: number;
}

const DEMO_METRICS: AdminMetrics = {
  totalUsers: 128,
  paidUsers: 34,
  casesCreated: 211,
  documentsUploaded: 642,
  emailsSent: 894,
  toReview: 12,
  amountRecovered: 148200,
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
    casesCreated,
    documentsUploaded,
    emailsSent,
    toReview,
    { data: paidCases },
    { data: subs },
  ] = await Promise.all([
    count(
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ),
    count(supabase.from("cases").select("id", { count: "exact", head: true })),
    count(
      supabase
        .from("case_documents")
        .select("id", { count: "exact", head: true }),
    ),
    count(
      supabase
        .from("email_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "outbound"),
    ),
    count(
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .or(
          "human_review_required.eq.true,status.eq.disputed,status.eq.human_review_required",
        ),
    ),
    supabase
      .from("cases")
      .select("original_amount, status")
      .in("status", ["paid", "closed"])
      .returns<{ original_amount: number | null; status: string }[]>(),
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
  const amountRecovered = (paidCases ?? []).reduce(
    (sum, c) => sum + (c.original_amount ?? 0),
    0,
  );

  return {
    totalUsers,
    paidUsers: activeSubs.length,
    casesCreated,
    documentsUploaded,
    emailsSent,
    toReview,
    amountRecovered,
    mrr,
  };
}
