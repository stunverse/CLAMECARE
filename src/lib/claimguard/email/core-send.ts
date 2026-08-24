import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { canTransition } from "@/lib/claimguard/state-machine";
import {
  renderCaseEmail,
  TEMPLATE_VERSION,
  type CaseEmailKind,
} from "@/lib/claimguard/email/templates";
import { caseReplyAddress } from "@/lib/claimguard/email/addressing";
import { sendRawEmail } from "@/lib/claimguard/email/send-raw";
import { checkOutboundCompliance } from "@/lib/claimguard/email/compliance";
import type { Case } from "@/lib/claimguard/types";
import type { CaseStatus, CaseEventSource } from "@/lib/claimguard/enums";

export interface PerformSendOptions {
  kind: CaseEmailKind;
  subject?: string;
  body?: string;
  /** 'client' for a manual send, 'automation' for a workflow-triggered send. */
  actor: CaseEventSource;
  actorUserId?: string | null;
}

export interface PerformSendResult {
  error?: string;
  messageId?: string;
  status?: CaseStatus;
  notSent?: boolean;
  /** True when the send was held back by the compliance guard (not an error to retry). */
  blocked?: boolean;
}

/**
 * Core case-email send, client-agnostic so it can run under the signed-in
 * user's RLS client (manual send) OR the service-role client (workflow job).
 * Renders from deterministic templates, sends via Resend with a per-case
 * Reply-To, records the message/thread/timeline/audit, and advances status
 * through allowed transitions only.
 */
export async function performCaseSend(
  supabase: SupabaseClient,
  row: Case,
  options: PerformSendOptions,
): Promise<PerformSendResult> {
  const to = row.debtor_accounting_email || row.debtor_email;
  if (!to) {
    return { error: "Aucune adresse email du client n'est renseignée." };
  }

  const { kind, actor } = options;
  const template = renderCaseEmail(kind, row);
  const subject = options.subject?.trim() || template.subject;
  const body = options.body?.trim() || template.body;

  // Compliance gate: never let coercive / impersonating wording reach the
  // debtor, whoever wrote it (template, AI draft, or a human). On a violation
  // the send is HELD (not sent), the case is flagged for human review, and we
  // return blocked:true so the workflow does not retry it as an error.
  const compliance = checkOutboundCompliance(subject, body);
  if (!compliance.ok) {
    await supabase
      .from("cases")
      .update({ human_review_required: true })
      .eq("id", row.id);
    await supabase.from("case_timeline").insert({
      case_id: row.id,
      event_type: "email_held_compliance",
      title: "Email retenu — vérification de conformité",
      description: `Termes non conformes détectés : ${compliance.violations
        .map((v) => v.term)
        .join(", ")}. Envoi bloqué, revue humaine requise.`,
      source: actor,
      metadata: { violations: compliance.violations },
    });
    await supabase.from("audit_logs").insert({
      user_id: options.actorUserId ?? row.user_id,
      case_id: row.id,
      action: "email_held_compliance",
      source: actor,
      metadata: { violations: compliance.violations },
    });
    return {
      blocked: true,
      error: `Envoi bloqué (conformité) : ${compliance.violations
        .map((v) => v.term)
        .join(", ")}.`,
    };
  }

  // Ensure a thread exists.
  let threadId: string | null = null;
  const { data: existingThread } = await supabase
    .from("email_threads")
    .select("id")
    .eq("case_id", row.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (existingThread) threadId = existingThread.id;
  else {
    const { data: created } = await supabase
      .from("email_threads")
      .insert({ case_id: row.id, subject })
      .select("id")
      .single<{ id: string }>();
    threadId = created?.id ?? null;
  }

  const from = env.CASE_EMAIL_FROM || env.EMAIL_FROM;
  const replyTo = caseReplyAddress(row.case_reference);
  const send = await sendRawEmail({ from, to, replyTo, subject, text: body });

  const { data: message } = await supabase
    .from("email_messages")
    .insert({
      case_id: row.id,
      thread_id: threadId,
      direction: "outbound",
      from_email: from,
      to_email: to,
      subject,
      body,
      status: send.sent ? "sent" : "queued",
      external_id: send.id,
      ai_generated: !options.body,
      requires_review: false,
      sent_at: send.sent ? new Date().toISOString() : null,
    })
    .select("id")
    .single<{ id: string }>();

  // Deterministic status advance.
  let applied: CaseStatus = row.status;
  if (kind === "first_contact") {
    if (canTransition(row.status, "first_contact_sent")) {
      applied = "first_contact_sent";
      if (canTransition(applied, "waiting_for_organization")) {
        applied = "waiting_for_organization";
      }
    }
  } else {
    applied = canTransition(row.status, "waiting_for_organization")
      ? "waiting_for_organization"
      : row.status;
  }

  await supabase
    .from("cases")
    .update({
      status: applied,
      last_contact_at: new Date().toISOString(),
      reminder_count: kind === "first_contact" ? 0 : row.reminder_count + 1,
    })
    .eq("id", row.id);

  await supabase.from("case_timeline").insert({
    case_id: row.id,
    event_type: kind === "first_contact" ? "first_contact_sent" : "reminder_sent",
    title:
      kind === "first_contact"
        ? "Premier contact envoyé"
        : `Relance envoyée (n° ${row.reminder_count + 1})`,
    description: send.sent
      ? `Email envoyé à ${to}.`
      : `Email préparé pour ${to} (envoi non configuré).`,
    old_status: row.status,
    new_status: applied !== row.status ? applied : null,
    source: actor,
    metadata: { template_version: TEMPLATE_VERSION, kind },
  });
  await supabase.from("audit_logs").insert({
    user_id: options.actorUserId ?? row.user_id,
    case_id: row.id,
    action: kind === "first_contact" ? "first_contact_sent" : "reminder_sent",
    source: actor,
    metadata: { to, sent: send.sent },
  });

  return { messageId: message?.id, status: applied, notSent: !send.sent };
}
