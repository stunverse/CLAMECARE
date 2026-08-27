"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/claimguard/state-machine";
import { createNotification } from "@/lib/notifications/actions";
import { formatEuro } from "@/lib/cases/format";
import type { Case } from "@/lib/claimguard/types";
import type { CaseStatus, PaymentType } from "@/lib/claimguard/enums";

export interface ConfirmPaymentInput {
  caseId: string;
  amount: number | null;
  paidAt: string | null; // ISO date
  type: PaymentType; // 'full' | 'partial'
}

export interface ConfirmPaymentResult {
  error?: string;
  status?: CaseStatus;
  remaining?: number | null;
  isDemo?: boolean;
}

/**
 * Cancel any pending workflow jobs for a case (reminders, due checks). Uses the
 * service-role client because workflow_jobs writes are reserved to staff by
 * RLS. Best-effort — a no-op when the service-role key is absent.
 */
async function cancelPendingJobs(caseId: string, reason: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("workflow_jobs")
    .update({ status: "cancelled", last_error: reason })
    .eq("case_id", caseId)
    .eq("status", "pending");
}

/**
 * Confirm a payment received by the CLIENT on their own account (§18).
 * MyDueGuard never handles the money — this only records the client's
 * attestation, updates the remaining amount, and moves the case forward.
 */
export async function confirmPayment(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, status: "paid", remaining: 0 };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", input.caseId)
    .maybeSingle<Case>();
  if (!row) return { error: "Dossier introuvable." };

  const outstanding = row.remaining_amount ?? row.original_amount ?? 0;
  const received = input.amount ?? outstanding;
  if (received <= 0) {
    return { error: "Le montant reçu doit être supérieur à 0." };
  }

  const remainingAfter =
    input.type === "full" ? 0 : Math.max(0, Number((outstanding - received).toFixed(2)));
  const fullyPaid = input.type === "full" || remainingAfter <= 0;
  const paidAt = input.paidAt ?? new Date().toISOString().slice(0, 10);

  await supabase.from("payment_confirmations").insert({
    case_id: row.id,
    user_id: user.id,
    amount: received,
    paid_at: paidAt,
    payment_type: input.type,
    remaining_after: remainingAfter,
  });

  // Deterministic state transition.
  let applied: CaseStatus = row.status;
  if (fullyPaid) {
    if (canTransition(row.status, "paid")) applied = "paid";
  }

  await supabase
    .from("cases")
    .update({
      remaining_amount: remainingAfter,
      status: applied,
    })
    .eq("id", row.id);

  await supabase.from("case_timeline").insert({
    case_id: row.id,
    event_type: fullyPaid ? "payment_confirmed" : "partial_payment",
    title: fullyPaid ? "Paiement confirmé" : "Paiement partiel enregistré",
    description: fullyPaid
      ? "Le prestataire a confirmé la réception du paiement complet."
      : `Paiement partiel reçu. Reste à percevoir : ${remainingAfter} €.`,
    old_status: row.status,
    new_status: applied !== row.status ? applied : null,
    source: "client",
    metadata: { amount: received, type: input.type, remaining_after: remainingAfter },
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: row.id,
    action: "payment_confirmed",
    source: "client",
    metadata: { amount: received, type: input.type, fully_paid: fullyPaid },
  });

  if (fullyPaid) {
    // Stop any further automation, then auto-close (§17/§18).
    await cancelPendingJobs(row.id, "case_paid");

    if (applied === "paid" && canTransition("paid", "closed")) {
      await supabase
        .from("cases")
        .update({ status: "closed" })
        .eq("id", row.id);
      await supabase.from("case_timeline").insert({
        case_id: row.id,
        event_type: "case_closed",
        title: "Dossier clôturé",
        description: "Paiement confirmé — dossier clôturé automatiquement.",
        old_status: "paid",
        new_status: "closed",
        source: "automation",
      });
      applied = "closed";
    }
  }

  await createNotification(supabase, {
    user_id: user.id,
    type: "claim_status_updated",
    title: fullyPaid ? "Paiement confirmé — dossier clôturé" : "Paiement partiel enregistré",
    message: fullyPaid
      ? `Vous avez confirmé le règlement de ${row.debtor_name ?? "votre client"}.`
      : `Reste à percevoir : ${formatEuro(remainingAfter)}.`,
    action_url: `/dossiers/${row.id}`,
  });

  return { status: applied, remaining: remainingAfter };
}

/** Report that the promised payment has NOT arrived (§17) → payment_overdue. */
export async function reportPaymentNotReceived(
  caseId: string,
): Promise<ConfirmPaymentResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, status: "payment_overdue" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  if (!row) return { error: "Dossier introuvable." };

  const applied: CaseStatus = canTransition(row.status, "payment_overdue")
    ? "payment_overdue"
    : row.status;

  await supabase.from("cases").update({ status: applied }).eq("id", caseId);
  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: "payment_overdue",
    title: "Paiement non reçu",
    description: "Le prestataire indique ne pas avoir reçu le paiement annoncé.",
    old_status: row.status,
    new_status: applied !== row.status ? applied : null,
    source: "client",
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: caseId,
    action: "payment_not_received",
    source: "client",
  });

  return { status: applied };
}
