"use server";

import { createClient } from "@/lib/supabase/server";
import { computeCompleteness } from "@/lib/cases/completeness";
import {
  parseCaseForm,
  deriveTotal,
  type CaseFormInput,
} from "@/lib/cases/form";
import {
  scheduleFirstContact,
  startCaseAutomation,
} from "@/lib/claimguard/workflow/engine";
import type { Case } from "@/lib/claimguard/types";

/**
 * Case creation & editing (cahier des charges §62-2).
 *
 * All amounts/dates/states are handled deterministically here — the AI is
 * only invoked later (Priority 3) to help *extract* fields from documents.
 * MyDueGuard never collects money: `payee_name`/`iban`/`bic` are the CLIENT's
 * own coordinates, stored only to communicate them to the debtor.
 */

export interface CaseActionResult {
  error?: string;
  caseId?: string;
  isDemo?: boolean;
}

async function upsertOrganization(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  input: CaseFormInput,
): Promise<string | null> {
  if (!input.debtor_name) return null;

  // Reuse an existing organisation of the same name for this user.
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", input.debtor_name)
    .maybeSingle<{ id: string }>();
  if (existing) return existing.id;

  const { data } = await supabase
    .from("organizations")
    .insert({
      user_id: userId,
      name: input.debtor_name,
      general_email: input.debtor_email,
      accounting_email: input.debtor_accounting_email,
      contact_name: input.debtor_contact_name,
    })
    .select("id")
    .single<{ id: string }>();
  return data?.id ?? null;
}

export async function createCase(
  input: CaseFormInput,
): Promise<CaseActionResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, caseId: "demo-1" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté pour créer un dossier." };

  const total = deriveTotal(input);
  const { score } = computeCompleteness({
    debtor_name: input.debtor_name,
    debtor_email: input.debtor_email,
    debtor_accounting_email: input.debtor_accounting_email,
    invoice_number: input.invoice_number,
    invoice_date: input.invoice_date,
    due_date: input.due_date,
    original_amount: total,
    amount_ht: input.amount_ht,
    service_description: input.service_description,
    payee_name: input.payee_name,
    iban: input.iban,
    documentCount: 0,
  });

  const organizationId = await upsertOrganization(supabase, user.id, input);

  // Fully automated flow: a case with a client email to write to starts as
  // `ready_to_contact` so the first email fires automatically — no manual click.
  // Without an email address we can't send, so it stays a draft.
  const canContact = Boolean(input.debtor_accounting_email || input.debtor_email);
  const initialStatus = canContact ? "ready_to_contact" : "draft";

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      organization_id: organizationId,
      debtor_name: input.debtor_name,
      debtor_email: input.debtor_email,
      debtor_accounting_email: input.debtor_accounting_email,
      debtor_contact_name: input.debtor_contact_name,
      debtor_phone: input.debtor_phone,
      payer_phone: input.payer_phone,
      invoice_number: input.invoice_number,
      invoice_date: input.invoice_date,
      due_date: input.due_date,
      amount_ht: input.amount_ht,
      vat_amount: input.vat_amount,
      original_amount: total,
      remaining_amount: total,
      service_description: input.service_description,
      payee_name: input.payee_name,
      iban: input.iban,
      bic: input.bic,
      status: initialStatus,
      completeness_score: score,
    })
    .select("*")
    .single<Case>();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer le dossier." };
  }

  // Deterministic timeline entry + audit log.
  await supabase.from("case_timeline").insert({
    case_id: data.id,
    event_type: "case_created",
    title: "Dossier créé",
    description: `Dossier ${data.case_reference} créé.`,
    new_status: initialStatus,
    source: "client",
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: data.id,
    action: "case_created",
    source: "client",
    metadata: { completeness_score: score },
  });

  // NB: the first contact is NOT sent here. The creation wizard lets the user
  // attach the invoice first (step 2); the send is triggered on "Terminer" via
  // finalizeCaseCreation. The case simply waits in `ready_to_contact`.
  return { caseId: data.id };
}

/**
 * Finalize case creation once the user has attached the invoice (wizard step 2)
 * and clicked "Terminer": trigger the automated first contact and the reminder
 * chain. Idempotent — a second call is a no-op once the case has been contacted.
 */
export async function finalizeCaseCreation(
  caseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: c } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  if (!c) return { ok: false, error: "Dossier introuvable." };

  const canContact = Boolean(c.debtor_accounting_email || c.debtor_email);
  if (canContact && c.automation_enabled && c.status === "ready_to_contact") {
    // Queue it (cron guarantees delivery) and try to send immediately.
    await scheduleFirstContact(supabase, c);
    try {
      await startCaseAutomation(supabase, c);
    } catch {
      // Swallow — the queued job + cron will deliver it.
    }
  }

  return { ok: true };
}

/* ----------------------------- form actions ------------------------------ */

export interface CaseFormState {
  error?: string;
  caseId?: string;
  isDemo?: boolean;
}

/** `useActionState`-compatible wrapper around createCase (kept for reuse). */
export async function createCaseAction(
  _prev: CaseFormState,
  formData: FormData,
): Promise<CaseFormState> {
  const input = parseCaseForm(formData);
  if (!input.debtor_name) {
    return { error: "Indiquez au moins le nom du client / de l'entreprise." };
  }
  return createCase(input);
}

/** `useActionState`-compatible wrapper around updateCase. */
export async function updateCaseAction(
  caseId: string,
  _prev: CaseFormState,
  formData: FormData,
): Promise<CaseFormState> {
  const input = parseCaseForm(formData);
  if (!input.debtor_name) {
    return { error: "Indiquez au moins le nom du client / de l'entreprise." };
  }
  return updateCase(caseId, input);
}

export async function updateCase(
  caseId: string,
  input: CaseFormInput,
): Promise<CaseActionResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, caseId };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  // Fetch document count so completeness reflects uploaded evidence.
  const { count: documentCount } = await supabase
    .from("case_documents")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  const total = deriveTotal(input);
  const { score } = computeCompleteness({
    debtor_name: input.debtor_name,
    debtor_email: input.debtor_email,
    debtor_accounting_email: input.debtor_accounting_email,
    invoice_number: input.invoice_number,
    invoice_date: input.invoice_date,
    due_date: input.due_date,
    original_amount: total,
    amount_ht: input.amount_ht,
    service_description: input.service_description,
    payee_name: input.payee_name,
    iban: input.iban,
    documentCount: documentCount ?? 0,
  });

  const { error } = await supabase
    .from("cases")
    .update({
      debtor_name: input.debtor_name,
      debtor_email: input.debtor_email,
      debtor_accounting_email: input.debtor_accounting_email,
      debtor_contact_name: input.debtor_contact_name,
      debtor_phone: input.debtor_phone,
      payer_phone: input.payer_phone,
      invoice_number: input.invoice_number,
      invoice_date: input.invoice_date,
      due_date: input.due_date,
      amount_ht: input.amount_ht,
      vat_amount: input.vat_amount,
      original_amount: total,
      service_description: input.service_description,
      payee_name: input.payee_name,
      iban: input.iban,
      bic: input.bic,
      completeness_score: score,
    })
    .eq("id", caseId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: caseId,
    action: "case_updated",
    source: "client",
    metadata: { completeness_score: score },
  });

  return { caseId };
}
