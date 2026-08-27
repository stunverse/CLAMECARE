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

  // Fully fault-tolerant: this is a "nice to have" banner, so any query issue
  // must degrade to null rather than break the dossiers page.
  try {
    // 1) Soonest pending workflow job for one of the user's cases (no PostgREST
    //    embed — fetch the job, then its case separately, to avoid any
    //    relationship-resolution error surfacing into the page render).
    const { data: job } = await supabase
      .from("workflow_jobs")
      .select("case_id, job_type, run_at")
      .eq("status", "pending")
      .order("run_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ case_id: string; job_type: string; run_at: string }>();

    if (job?.case_id) {
      const { data: c } = await supabase
        .from("cases")
        .select("case_reference, debtor_name")
        .eq("id", job.case_id)
        .maybeSingle<{ case_reference: string; debtor_name: string | null }>();
      if (c) {
        return {
          label: JOB_LABELS[job.job_type] ?? "Action planifiée",
          detail: `${c.debtor_name ?? "Client"} · ${formatDateTimeFr(job.run_at)}`,
          caseId: job.case_id,
          caseRef: c.case_reference,
        };
      }
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
        Pick<
          Case,
          "id" | "case_reference" | "debtor_name" | "promised_payment_date"
        >
      >();

    if (promised?.promised_payment_date) {
      return {
        label: "Contrôle du paiement promis",
        detail: `${promised.debtor_name ?? "Client"} · le ${formatDateFr(promised.promised_payment_date)}`,
        caseId: promised.id,
        caseRef: promised.case_reference,
      };
    }
  } catch {
    return null;
  }

  return null;
}
