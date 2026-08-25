import { getCases } from "@/lib/cases/queries";
import { daysUntil } from "@/lib/format";
import { ACTIVE_CASE_STATUSES } from "@/lib/claimguard/enums";
import type { Case } from "@/lib/claimguard/types";

/**
 * Client (debtor) directory (§47). Aggregates the freelancer's cases by client
 * so recurring bad payers are visible at a glance. Grouped by debtor name,
 * which is always present as the display label.
 */

export interface ClientSummary {
  name: string;
  caseCount: number;
  activeCount: number;
  outstanding: number;
  settled: number;
  overdueCount: number;
  lastActivity: string; // ISO
}

function isOverdue(c: Case): boolean {
  if (c.status === "payment_overdue") return true;
  if (["paid", "closed", "cancelled"].includes(c.status)) return false;
  const d = daysUntil(c.due_date);
  return d !== null && d < 0;
}

export async function getClientSummaries(): Promise<{
  clients: ClientSummary[];
  isDemo: boolean;
}> {
  const { cases, isDemo } = await getCases();

  const map = new Map<string, ClientSummary>();
  for (const c of cases) {
    const name = c.debtor_name?.trim() || "Client à renseigner";
    const existing =
      map.get(name) ??
      ({
        name,
        caseCount: 0,
        activeCount: 0,
        outstanding: 0,
        settled: 0,
        overdueCount: 0,
        lastActivity: c.updated_at,
      } as ClientSummary);

    existing.caseCount += 1;
    if (ACTIVE_CASE_STATUSES.includes(c.status)) {
      existing.activeCount += 1;
      existing.outstanding += c.remaining_amount ?? c.original_amount ?? 0;
    }
    if (c.status === "paid" || c.status === "closed") {
      existing.settled += c.original_amount ?? 0;
    }
    if (isOverdue(c)) existing.overdueCount += 1;
    if (c.updated_at > existing.lastActivity) existing.lastActivity = c.updated_at;

    map.set(name, existing);
  }

  const clients = [...map.values()].sort(
    (a, b) => b.outstanding - a.outstanding,
  );
  return { clients, isDemo };
}
