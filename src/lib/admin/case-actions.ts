"use server";

import { createClient } from "@/lib/supabase/server";
import { canTransition } from "@/lib/claimguard/state-machine";
import { performCaseSend } from "@/lib/claimguard/email/core-send";
import type { Case } from "@/lib/claimguard/types";
import type { CaseStatus } from "@/lib/claimguard/enums";

/**
 * Staff (admin/agent) case actions (§24). All run under the staff member's RLS
 * client — cases/email/timeline writes are permitted to is_staff() by policy;
 * workflow_jobs writes are permitted to is_staff() too. Every action is
 * server-validated and audit-logged.
 */

async function requireStaff(): Promise<
  | { error: string }
  | { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; userId: string; role: "admin" | "agent" }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Non configuré." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: "admin" | "agent" | null }>();
  if (!adminRow) return { error: "Accès réservé au staff." };
  return { supabase, userId: user.id, role: adminRow.role ?? "admin" };
}

async function logAudit(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  caseId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    case_id: caseId,
    action,
    source: "admin",
    metadata,
  });
}

export async function setCaseStatus(
  caseId: string,
  newStatus: CaseStatus,
  reason?: string,
): Promise<{ error?: string }> {
  const ctx = await requireStaff();
  if ("error" in ctx) return ctx;
  const { supabase, userId } = ctx;

  const { data: row } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .maybeSingle<Pick<Case, "status">>();
  if (!row) return { error: "Dossier introuvable." };

  // Staff may override, but we still record whether it was an allowed path.
  await supabase.from("cases").update({ status: newStatus }).eq("id", caseId);
  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: "status_changed_by_staff",
    title: "Statut modifié par le staff",
    description: reason || null,
    old_status: row.status,
    new_status: newStatus,
    source: "admin",
    metadata: { allowed_transition: canTransition(row.status, newStatus) },
  });
  await logAudit(supabase, userId, caseId, "status_changed", {
    from: row.status,
    to: newStatus,
  });
  return {};
}

export async function setAutomation(
  caseId: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const ctx = await requireStaff();
  if ("error" in ctx) return ctx;
  const { supabase, userId } = ctx;

  await supabase
    .from("cases")
    .update({ automation_enabled: enabled })
    .eq("id", caseId);

  // Suspending automation cancels pending jobs so nothing fires meanwhile.
  if (!enabled) {
    await supabase
      .from("workflow_jobs")
      .update({ status: "cancelled", last_error: "automation_suspended" })
      .eq("case_id", caseId)
      .eq("status", "pending");
  }

  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: enabled ? "automation_resumed" : "automation_suspended",
    title: enabled ? "Automatisation reprise" : "Automatisation suspendue",
    source: "admin",
  });
  await logAudit(supabase, userId, caseId, "automation_toggled", { enabled });
  return {};
}

export async function clearHumanReview(
  caseId: string,
): Promise<{ error?: string }> {
  const ctx = await requireStaff();
  if ("error" in ctx) return ctx;
  const { supabase, userId } = ctx;

  await supabase
    .from("cases")
    .update({ human_review_required: false })
    .eq("id", caseId);
  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: "review_cleared",
    title: "Revue humaine levée",
    source: "admin",
  });
  await logAudit(supabase, userId, caseId, "review_cleared");
  return {};
}

export async function addAdminNote(
  caseId: string,
  note: string,
): Promise<{ error?: string }> {
  const ctx = await requireStaff();
  if ("error" in ctx) return ctx;
  const { supabase, userId } = ctx;
  const text = note.trim();
  if (!text) return { error: "Note vide." };

  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: "admin_note",
    title: "Note interne",
    description: text,
    source: "admin",
  });
  await logAudit(supabase, userId, caseId, "admin_note_added");
  return {};
}

export async function sendManualCaseEmail(
  caseId: string,
  subject: string,
  body: string,
): Promise<{ error?: string }> {
  const ctx = await requireStaff();
  if ("error" in ctx) return ctx;
  const { supabase, userId } = ctx;

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  if (!row) return { error: "Dossier introuvable." };

  const res = await performCaseSend(supabase, row, {
    kind: "reminder",
    subject,
    body,
    actor: "admin",
    actorUserId: userId,
  });
  return { error: res.error };
}
