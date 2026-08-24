import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyEmail } from "@/lib/claimguard/ai/classify-email";
import { PROMPT_VERSION_CLASSIFY } from "@/lib/claimguard/ai/classify-email";
import { parseCaseReference } from "@/lib/claimguard/email/addressing";
import { canTransition } from "@/lib/claimguard/state-machine";
import { enqueueJob } from "@/lib/claimguard/workflow/engine";
import { env, isOpenAIConfigured } from "@/lib/env";
import type { Case } from "@/lib/claimguard/types";
import type { CaseStatus } from "@/lib/claimguard/enums";

export interface InboundEmail {
  to: string | null;
  from: string | null;
  subject: string | null;
  text: string | null;
  externalId?: string | null;
}

export interface InboundResult {
  ok: boolean;
  reason?: string;
  caseId?: string;
  category?: string;
  requiresReview?: boolean;
}

/**
 * Map an inbound classification to the deterministic next status. The AI
 * chooses the category; THIS code decides the state transition (§7).
 */
function nextStatusForCategory(
  current: CaseStatus,
  category: string,
  hasPromise: boolean,
): CaseStatus {
  if (category === "payment_confirmed") return "paid";
  if (category === "payment_date_given" && hasPromise) return "payment_promised";
  if (category === "dispute" || category === "invoice_rejected") return "disputed";
  if (
    [
      "document_missing",
      "invoice_not_received",
      "wrong_invoice",
      "purchase_order_missing",
      "request_information",
    ].includes(category)
  ) {
    return "document_requested";
  }
  if (["accounting_processing", "waiting_internal_approval"].includes(category)) {
    return "in_discussion";
  }
  // out_of_office / unknown → stay where we are
  return current;
}

/**
 * Process one inbound email against the addressed case. Uses whichever
 * Supabase client is passed (service-role from the webhook). Deterministic
 * routing + state transition; AI only for classification/summary.
 */
export async function processInboundEmail(
  supabase: SupabaseClient,
  email: InboundEmail,
): Promise<InboundResult> {
  const reference = parseCaseReference(email.to, email.subject, email.text);
  if (!reference) return { ok: false, reason: "no_case_reference" };

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("case_reference", reference)
    .maybeSingle<Case>();
  if (!row) return { ok: false, reason: "case_not_found" };

  const subject = email.subject ?? "";
  const body = email.text ?? "";

  const classification = await classifyEmail(subject, body);
  const requiresReview = classification.confidence < 0.6;

  // Find or create the thread.
  let threadId: string | null = null;
  const { data: thread } = await supabase
    .from("email_threads")
    .select("id")
    .eq("case_id", row.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (thread) threadId = thread.id;
  else {
    const { data: created } = await supabase
      .from("email_threads")
      .insert({ case_id: row.id, subject })
      .select("id")
      .single<{ id: string }>();
    threadId = created?.id ?? null;
  }

  // Store the inbound message.
  const { data: message } = await supabase
    .from("email_messages")
    .insert({
      case_id: row.id,
      thread_id: threadId,
      direction: "inbound",
      from_email: email.from,
      to_email: email.to,
      subject,
      body,
      category: classification.category,
      confidence: classification.confidence,
      status: "received",
      external_id: email.externalId ?? null,
      requires_review: requiresReview,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  // Record the classification for audit.
  await supabase.from("ai_classifications").insert({
    case_id: row.id,
    email_message_id: message?.id ?? null,
    kind: "email_classification",
    result: {
      category: classification.category,
      summary: classification.summary,
      promise: classification.promise,
    },
    confidence: classification.confidence,
    model: isOpenAIConfigured ? env.OPENAI_MODEL : "heuristic",
    prompt_version: PROMPT_VERSION_CLASSIFY,
  });

  // Extract a payment promise (deterministic persistence of the AI's grounded read).
  const hasPromise = Boolean(classification.promise?.promised_date);
  if (hasPromise && classification.promise) {
    await supabase.from("payment_promises").insert({
      case_id: row.id,
      promised_date: classification.promise.promised_date,
      amount: classification.promise.amount,
      source_email_id: message?.id ?? null,
    });
  }

  // Deterministic state transition.
  const target = nextStatusForCategory(row.status, classification.category, hasPromise);
  const applied = canTransition(row.status, target) ? target : row.status;

  const patch: Record<string, unknown> = {
    last_contact_at: new Date().toISOString(),
    status: applied,
    human_review_required: requiresReview || row.human_review_required,
  };
  if (applied === "payment_promised" && classification.promise?.promised_date) {
    patch.promised_payment_date = classification.promise.promised_date;
  }
  await supabase.from("cases").update(patch).eq("id", row.id);

  // Payment confirmed by the organisme → stop all pending automation.
  if (applied === "paid") {
    await supabase
      .from("workflow_jobs")
      .update({ status: "cancelled", last_error: "case_paid" })
      .eq("case_id", row.id)
      .eq("status", "pending");
  }

  // Schedule a deterministic payment-due check the day after the promised date.
  if (applied === "payment_promised" && classification.promise?.promised_date) {
    const dueCheck = new Date(`${classification.promise.promised_date}T12:00:00.000Z`);
    dueCheck.setUTCDate(dueCheck.getUTCDate() + 1);
    await enqueueJob(supabase, {
      caseId: row.id,
      jobType: "payment_due_check",
      runAt: dueCheck,
      idempotencyKey: `due_check:${row.id}:${classification.promise.promised_date}`,
    });
  }

  await supabase.from("case_timeline").insert({
    case_id: row.id,
    event_type: "email_received",
    title: "Réponse du client reçue",
    description: classification.summary || null,
    old_status: row.status,
    new_status: applied !== row.status ? applied : null,
    source: "ai",
    metadata: {
      category: classification.category,
      confidence: classification.confidence,
      requires_review: requiresReview,
    },
  });
  await supabase.from("audit_logs").insert({
    user_id: row.user_id,
    case_id: row.id,
    action: "email_received",
    source: "ai",
    metadata: { category: classification.category, status: applied },
  });

  return {
    ok: true,
    caseId: row.id,
    category: classification.category,
    requiresReview,
  };
}
