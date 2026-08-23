"use server";

import { createClient } from "@/lib/supabase/server";
import {
  renderCaseEmail,
  kindForReminder,
  type CaseEmailKind,
} from "@/lib/claimguard/email/templates";
import { performCaseSend } from "@/lib/claimguard/email/core-send";
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

  const kind = input.kind ?? kindForReminder(row.reminder_count);
  const result = await performCaseSend(supabase, row, {
    kind,
    subject: input.subject,
    body: input.body,
    actor: "client",
    actorUserId: user.id,
  });

  return {
    error: result.error,
    messageId: result.messageId,
    status: result.status,
    notSent: result.notSent,
  };
}
