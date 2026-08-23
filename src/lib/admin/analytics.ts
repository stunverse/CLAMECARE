import type { SupabaseClient } from "@supabase/supabase-js";
import type { Case } from "@/lib/claimguard/types";
import {
  CASE_STATUSES,
  ACTIVE_CASE_STATUSES,
  type CaseStatus,
} from "@/lib/claimguard/enums";

export interface Analytics {
  total: number;
  byStatus: { status: CaseStatus; count: number }[];
  resolutionRate: number; // paid+closed / total
  avgResolutionDays: number | null;
  automationShare: number; // automated / active
  promiseKeptRate: number | null; // paid cases that had a promise
  totalTracked: number;
  totalPaid: number;
}

/** MS between two ISO timestamps, or null when either is missing/invalid. */
function daysBetween(a: string, b: string): number | null {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
  return (t2 - t1) / 86_400_000;
}

/**
 * Deterministic analytics computed from case rows (§11/§23). All figures are
 * derived in code — no AI — so the numbers are reproducible.
 */
export async function getAnalytics(
  supabase: SupabaseClient,
): Promise<Analytics> {
  const { data } = await supabase
    .from("cases")
    .select(
      "status, original_amount, remaining_amount, automation_enabled, created_at, updated_at, promised_payment_date",
    )
    .returns<
      Pick<
        Case,
        | "status"
        | "original_amount"
        | "remaining_amount"
        | "automation_enabled"
        | "created_at"
        | "updated_at"
        | "promised_payment_date"
      >[]
    >();

  const rows = data ?? [];
  const total = rows.length;

  const byStatus = CASE_STATUSES.map((status) => ({
    status,
    count: rows.filter((r) => r.status === status).length,
  }));

  const resolved = rows.filter(
    (r) => r.status === "paid" || r.status === "closed",
  );
  const active = rows.filter((r) => ACTIVE_CASE_STATUSES.includes(r.status));

  const delays = resolved
    .map((r) => daysBetween(r.created_at, r.updated_at))
    .filter((d): d is number => d !== null && d >= 0);
  const avgResolutionDays = delays.length
    ? Math.round((delays.reduce((s, d) => s + d, 0) / delays.length) * 10) / 10
    : null;

  const withPromise = resolved.filter((r) => r.promised_payment_date);
  const promiseKeptRate = withPromise.length
    ? withPromise.length / Math.max(resolved.length, 1)
    : null;

  return {
    total,
    byStatus: byStatus.filter((b) => b.count > 0),
    resolutionRate: total ? resolved.length / total : 0,
    avgResolutionDays,
    automationShare: active.length
      ? active.filter((r) => r.automation_enabled).length / active.length
      : 0,
    promiseKeptRate,
    totalTracked: active.reduce(
      (s, r) => s + (r.remaining_amount ?? r.original_amount ?? 0),
      0,
    ),
    totalPaid: resolved.reduce((s, r) => s + (r.original_amount ?? 0), 0),
  };
}
