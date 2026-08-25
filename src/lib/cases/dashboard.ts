import { createClient } from "@/lib/supabase/server";
import { formatDateTimeFr, formatDateFr } from "@/lib/cases/format";
import type { Case } from "@/lib/claimguard/types";

/**
 * "Prochaine action ClaimGuard" (cahier des charges §44) — the single upcoming
 * automated action, so the client feels ClaimGuard is actively working. Read
 * from the pending workflow queue first (source of truth), falling back to the
 * soonest announced payment date.
 */

export interface NextAction {
  label: string;
  detail: string;
  caseId: string;
  caseRef: string;
}

const JOB_LABELS: Record<string, string> = {
  send_first_contact: "Premier contact à votre client",
  send_reminder: "Relance automatique",
  payment_due_check: "Contrôle du paiement promis",
};

interface JobRow {
  case_id: string;
  job_type: string;
  run_at: string;
  cases: { case_reference: string; debtor_name: string | null } | null;
}

export async function getNextAction(): Promise<NextAction | null> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      label: "Relance automatique",
      detail: "OF Horizon Compétences · prévue prochainement",
      caseId: "demo-1",
      caseRef: "CG-2026-000042",
    };
  }

  // 1) Soonest pending workflow job for one of the user's cases.
  const { data: job } = await supabase
    .from("workflow_jobs")
    .select("case_id, job_type, run_at, cases(case_reference, debtor_name)")
    .eq("status", "pending")
    .order("run_at", { ascending: true })
    .limit(1)
    .maybeSingle<JobRow>();

  if (job?.cases) {
    return {
      label: JOB_LABELS[job.job_type] ?? "Action planifiée",
      detail: `${job.cases.debtor_name ?? "Client"} · ${formatDateTimeFr(job.run_at)}`,
      caseId: job.case_id,
      caseRef: job.cases.case_reference,
    };
  }

  // 2) Fallback: the soonest announced payment date still ahead.
  const today = new Date().toISOString().slice(0, 10);
  const { data: promised } = await supabase
    .from("cases")
    .select("id, case_reference, debtor_name, promised_payment_date")
    .eq("status", "payment_promised")
    .gte("promised_payment_date", today)
    .order("promised_payment_date", { ascending: true })
    .limit(1)
    .maybeSingle<
      Pick<Case, "id" | "case_reference" | "debtor_name" | "promised_payment_date">
    >();

  if (promised?.promised_payment_date) {
    return {
      label: "Contrôle du paiement promis",
      detail: `${promised.debtor_name ?? "Client"} · le ${formatDateFr(promised.promised_payment_date)}`,
      caseId: promised.id,
      caseRef: promised.case_reference,
    };
  }

  return null;
}
