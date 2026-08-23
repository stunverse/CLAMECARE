import type { SupabaseClient } from "@supabase/supabase-js";
import type { Case } from "@/lib/claimguard/types";
import { ACTIVE_CASE_STATUSES, type CaseStatus } from "@/lib/claimguard/enums";

/* ------------------------------ review queue ------------------------------ */

export type ReviewPriority = "critical" | "high" | "normal";

export interface ReviewReason {
  priority: ReviewPriority;
  label: string;
}

/**
 * Deterministic reason + priority for the human-review queue (§45/§46). Derived
 * purely from the case's stored state — no AI, so the queue ordering is stable.
 */
export function reviewReason(c: Case): ReviewReason | null {
  if (c.status === "disputed") {
    return { priority: "critical", label: "Litige / contestation" };
  }
  if (c.status === "human_review_required") {
    return { priority: "high", label: "Revue humaine demandée" };
  }
  if (c.human_review_required) {
    return { priority: "high", label: "Confiance IA faible" };
  }
  if (c.status === "payment_overdue") {
    return { priority: "normal", label: "Paiement en retard" };
  }
  return null;
}

const PRIORITY_RANK: Record<ReviewPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

export interface ReviewItem {
  case: Case;
  reason: ReviewReason;
}

/** Cases needing human attention, most urgent first. */
export async function getReviewQueue(
  supabase: SupabaseClient,
): Promise<ReviewItem[]> {
  const { data } = await supabase
    .from("cases")
    .select("*")
    .or(
      "status.eq.disputed,status.eq.human_review_required,status.eq.payment_overdue,human_review_required.eq.true",
    )
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<Case[]>();

  const items: ReviewItem[] = [];
  for (const c of data ?? []) {
    const reason = reviewReason(c);
    if (reason) items.push({ case: c, reason });
  }
  items.sort(
    (a, b) => PRIORITY_RANK[a.reason.priority] - PRIORITY_RANK[b.reason.priority],
  );
  return items;
}

/* ------------------------------ admin filters ----------------------------- */

export interface CaseFilters {
  status?: CaseStatus | "all" | "active";
  humanReview?: boolean;
  search?: string;
}

export async function getAdminCases(
  supabase: SupabaseClient,
  filters: CaseFilters = {},
): Promise<Case[]> {
  let query = supabase.from("cases").select("*");

  if (filters.status && filters.status !== "all") {
    if (filters.status === "active") {
      query = query.in("status", ACTIVE_CASE_STATUSES);
    } else {
      query = query.eq("status", filters.status);
    }
  }
  if (filters.humanReview) {
    query = query.eq("human_review_required", true);
  }
  if (filters.search) {
    const s = filters.search.replace(/[%,]/g, "");
    query = query.or(
      `debtor_name.ilike.%${s}%,invoice_number.ilike.%${s}%,case_reference.ilike.%${s}%`,
    );
  }

  const { data } = await query
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<Case[]>();
  return data ?? [];
}

/* --------------------------------- stats ---------------------------------- */

export interface AdminStats {
  openCases: number;
  totalTracked: number;
  totalPaid: number;
  automated: number;
  needsReview: number;
  emailsSent: number;
  emailsReceived: number;
  resolutionRate: number; // 0..1
}

export async function getAdminStats(
  supabase: SupabaseClient,
): Promise<AdminStats> {
  const { data: cases } = await supabase
    .from("cases")
    .select(
      "status, original_amount, remaining_amount, automation_enabled, human_review_required",
    )
    .returns<
      Pick<
        Case,
        | "status"
        | "original_amount"
        | "remaining_amount"
        | "automation_enabled"
        | "human_review_required"
      >[]
    >();

  const rows = cases ?? [];
  const active = rows.filter((c) =>
    ACTIVE_CASE_STATUSES.includes(c.status),
  );
  const paidOrClosed = rows.filter(
    (c) => c.status === "paid" || c.status === "closed",
  );
  const totalTracked = active.reduce(
    (s, c) => s + (c.remaining_amount ?? c.original_amount ?? 0),
    0,
  );
  const totalPaid = paidOrClosed.reduce(
    (s, c) => s + (c.original_amount ?? 0),
    0,
  );

  const [{ count: emailsSent }, { count: emailsReceived }] = await Promise.all([
    supabase
      .from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "outbound"),
    supabase
      .from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "inbound"),
  ]);

  return {
    openCases: active.length,
    totalTracked,
    totalPaid,
    automated: active.filter((c) => c.automation_enabled).length,
    needsReview: rows.filter(
      (c) => c.human_review_required || c.status === "disputed",
    ).length,
    emailsSent: emailsSent ?? 0,
    emailsReceived: emailsReceived ?? 0,
    resolutionRate: rows.length ? paidOrClosed.length / rows.length : 0,
  };
}
