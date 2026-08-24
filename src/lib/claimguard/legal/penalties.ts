/**
 * Deterministic dunning arithmetic (cahier des charges §28/§34).
 *
 * Computes what the CREANCIER (the freelancer) is legally owed on a late B2B
 * invoice: principal + late-payment penalties + the fixed €40 recovery
 * indemnity (art. D441-5 Code de commerce). This is the CREANCE side and is
 * kept strictly separate from ClaimGuard's own subscription billing — the two
 * must never be mixed (§34). No AI: pure, auditable arithmetic.
 *
 * IMPORTANT: these are sums owed to the creditor, NOT "ClaimGuard fees", and
 * ClaimGuard never charges the debtor for its own service.
 */

export interface DunningConfig {
  /** Annual late-payment rate applied to the principal. Configurable per §25.
   *  Default is a placeholder; the legal floor when the CGV are silent is
   *  "3× the legal interest rate" — set the real value in automation_settings. */
  late_penalty_annual_rate: number;
  /** Fixed recovery indemnity — €40 by law (art. D441-5). */
  fixed_indemnity: number;
}

export const DEFAULT_DUNNING: DunningConfig = {
  late_penalty_annual_rate: 0.12,
  fixed_indemnity: 40,
};

export function parseDunningConfig(value: unknown): DunningConfig {
  const v = (value ?? {}) as Partial<DunningConfig>;
  return {
    late_penalty_annual_rate:
      typeof v.late_penalty_annual_rate === "number" && v.late_penalty_annual_rate >= 0
        ? v.late_penalty_annual_rate
        : DEFAULT_DUNNING.late_penalty_annual_rate,
    fixed_indemnity:
      typeof v.fixed_indemnity === "number" && v.fixed_indemnity >= 0
        ? v.fixed_indemnity
        : DEFAULT_DUNNING.fixed_indemnity,
  };
}

export interface DunningResult {
  principal: number;
  daysOverdue: number;
  penalties: number;
  fixedIndemnity: number;
  total: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function toDate(v: string | Date): Date {
  return typeof v === "string" ? new Date(v) : v;
}

/**
 * Compute the amounts owed as of `asOf`. `asOf` is passed in (never read from
 * the clock here) so the result is deterministic and testable. When the
 * invoice is not yet due, penalties are 0.
 */
export function computeDunning(
  principal: number,
  dueDate: string | Date | null,
  asOf: string | Date,
  config: DunningConfig = DEFAULT_DUNNING,
): DunningResult {
  const p = Number.isFinite(principal) && principal > 0 ? principal : 0;
  const due = dueDate ? toDate(dueDate) : null;
  const now = toDate(asOf);

  let daysOverdue = 0;
  if (due && !Number.isNaN(due.getTime()) && !Number.isNaN(now.getTime())) {
    const ms = now.getTime() - due.getTime();
    daysOverdue = ms > 0 ? Math.floor(ms / 86_400_000) : 0;
  }

  const penalties =
    daysOverdue > 0
      ? round2((p * config.late_penalty_annual_rate * daysOverdue) / 365)
      : 0;
  // The fixed indemnity is due only once a payment is actually late.
  const fixedIndemnity = daysOverdue > 0 ? config.fixed_indemnity : 0;

  return {
    principal: round2(p),
    daysOverdue,
    penalties,
    fixedIndemnity,
    total: round2(p + penalties + fixedIndemnity),
  };
}
