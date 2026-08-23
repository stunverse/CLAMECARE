"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { canTransition } from "@/lib/claimguard/state-machine";
import {
  renderCaseEmail,
  kindForReminder,
  TEMPLATE_VERSION,
  type CaseEmailKind,
} from "@/lib/claimguard/email/templates";
import { caseReplyAddress } from "@/lib/claimguard/email/addressing";
import { sendRawEmail } from "@/lib/claimguard/email/send-raw";
import type { Case } from "@/lib/claimguard/types";
import type { CaseStatus } from "@/lib/claimguard/enums";

export interface SendCaseEmailInput {
  caseId: string;
  /** Force a template kind; defaults to the one derived from reminder_count. */
  kind?: CaseEmailKind;
  /** Reviewed subject/body from the compose UI (overrides the template). */
  subject?: string;
  body?: string;
}

export interface SendCaseEmailResult {
  error?: string;
  messageId?: string;
  status?: CaseStatus;
  isDemo?: boolean;
  notSent?: boolean;
}

/** Preview the outbound draft without sending (for the compose UI). */
export async function draftCaseEmail(
  caseId: string,
): Promise<{ subject: string; body: string; to: string | null } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      subject: "Règlement de la facture",
      body: "Bonjour,\n\n[Aperçu de démonstration]\n\nCordialement",
      to: null,
    };
  }
  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  if (!row) return { error: "Dossier introuvable." };

  const kind = kindForReminder(row.reminder_count);
  const { subject, body } = renderCaseEmail(kind, row);
  const to = row.debtor_accounting_email || row.debtor_email || null;
  return { subject, body, to };
}

/**
 * Send an outbound case email (first contact or reminder), record it, and
 * advance the case status deterministically. Human-in-the-loop: the caller
 * (the compose UI) may pass a reviewed subject/body.
 */
export async function sendCaseEmail(
  input: SendCaseEmailInput,
): Promise<SendCaseEmailResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, status: "first_contact_sent" };

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

  const to = row.debtor_accounting_email || row.debtor_email;
  if (!to) {
    return { error: "Aucune adresse email de l'organisme n'est renseignée." };
  }

  const kind = input.kind ?? kindForReminder(row.reminder_count);
  const template = renderCaseEmail(kind, row);
  const subject = input.subject?.trim() || template.subject;
  const body = input.body?.trim() || template.body;

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
      ai_generated: !input.body,
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
      // Immediately move to the resting "waiting" state.
      if (canTransition(applied, "waiting_for_organization")) {
        applied = "waiting_for_organization";
      }
    }
  } else {
    // reminder loop — stay in waiting_for_organization
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
    source: "client",
    metadata: { template_version: TEMPLATE_VERSION, kind },
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: row.id,
    action: kind === "first_contact" ? "first_contact_sent" : "reminder_sent",
    source: "client",
    metadata: { to, sent: send.sent },
  });

  return {
    messageId: message?.id,
    status: applied,
    notSent: !send.sent,
  };
}
