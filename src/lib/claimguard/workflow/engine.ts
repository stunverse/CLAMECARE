import type { SupabaseClient } from "@supabase/supabase-js";
import { performCaseSend } from "@/lib/claimguard/email/core-send";
import { canTransition, isTerminal } from "@/lib/claimguard/state-machine";
import {
  parseRemindersConfig,
  nextReminderAt,
  clampToBusinessWindow,
  addDays,
  type RemindersConfig,
} from "@/lib/claimguard/workflow/schedule";
import type { Case, WorkflowJob } from "@/lib/claimguard/types";

/* --------------------------------- types ---------------------------------- */

export type JobType =
  | "send_first_contact"
  | "send_reminder"
  | "payment_due_check";

export interface EnqueueInput {
  caseId: string;
  jobType: JobType;
  runAt: Date;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
}

/* ------------------------------- settings --------------------------------- */

export async function loadRemindersConfig(
  supabase: SupabaseClient,
): Promise<RemindersConfig> {
  const { data } = await supabase
    .from("automation_settings")
    .select("value")
    .eq("key", "reminders")
    .maybeSingle<{ value: unknown }>();
  return parseRemindersConfig(data?.value);
}

/* -------------------------------- enqueue --------------------------------- */

/**
 * Idempotently enqueue a job. The unique idempotency_key means a duplicate
 * enqueue (same key) is silently ignored, so re-runs never double-schedule.
 */
export async function enqueueJob(
  supabase: SupabaseClient,
  input: EnqueueInput,
): Promise<void> {
  await supabase
    .from("workflow_jobs")
    .upsert(
      {
        case_id: input.caseId,
        job_type: input.jobType,
        status: "pending",
        run_at: input.runAt.toISOString(),
        attempts: 0,
        max_attempts: input.maxAttempts ?? 5,
        idempotency_key: input.idempotencyKey ?? null,
        payload: input.payload ?? {},
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );
}

/** Schedule the automated first contact for a case that is ready to contact. */
export async function scheduleFirstContact(
  supabase: SupabaseClient,
  caseRow: Pick<Case, "id" | "status" | "automation_enabled">,
): Promise<void> {
  if (!caseRow.automation_enabled) return;
  if (caseRow.status !== "ready_to_contact") return;
  const config = await loadRemindersConfig(supabase);
  const runAt = clampToBusinessWindow(
    addDays(new Date(), config.first_contact_day),
    config,
  );
  await enqueueJob(supabase, {
    caseId: caseRow.id,
    jobType: "send_first_contact",
    runAt,
    idempotencyKey: `first_contact:${caseRow.id}`,
  });
}

/* -------------------------------- handlers -------------------------------- */

async function loadCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<Case | null> {
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  return data ?? null;
}

/** Guard shared by every automated action. */
function automationBlocked(c: Case): boolean {
  return (
    !c.automation_enabled ||
    c.human_review_required ||
    isTerminal(c.status)
  );
}

/**
 * Send the first contact for a case that is exactly `ready_to_contact`, then
 * schedule the first reminder. Shared by the workflow job and the immediate
 * trigger at case creation. Returns the send result (blocked/error surfaced).
 */
async function runFirstContact(
  supabase: SupabaseClient,
  c: Case,
): Promise<{ blocked?: boolean; error?: string }> {
  const res = await performCaseSend(supabase, c, {
    kind: "first_contact",
    actor: "automation",
  });
  if (res.blocked || res.error) return res;

  // Schedule the first reminder from now.
  const config = await loadRemindersConfig(supabase);
  const runAt = nextReminderAt(new Date(), 0, config);
  if (runAt) {
    await enqueueJob(supabase, {
      caseId: c.id,
      jobType: "send_reminder",
      runAt,
      idempotencyKey: `reminder:${c.id}:0`,
      payload: { index: 0 },
    });
  }
  return res;
}

/**
 * Kick off automation the moment a case is created ready to contact: send the
 * first email now (no manual click) and let the reminder chain follow. Safe to
 * call alongside the queued `send_first_contact` job — whichever runs first
 * advances the status, and the other becomes a no-op.
 */
export async function startCaseAutomation(
  supabase: SupabaseClient,
  caseRow: Case,
): Promise<void> {
  if (automationBlocked(caseRow) || caseRow.status !== "ready_to_contact") return;
  await runFirstContact(supabase, caseRow);
}

async function handleFirstContact(
  supabase: SupabaseClient,
  job: WorkflowJob,
): Promise<void> {
  const c = await loadCase(supabase, job.case_id);
  if (!c) return;
  // Idempotent: only act if still exactly ready_to_contact.
  if (automationBlocked(c) || c.status !== "ready_to_contact") return;

  const res = await runFirstContact(supabase, c);
  // A compliance hold is a terminal, non-retryable outcome (case is now in
  // human review) — do not throw, or the job would retry indefinitely.
  if (res.blocked) return;
  if (res.error) throw new Error(res.error);
}

async function handleReminder(
  supabase: SupabaseClient,
  job: WorkflowJob,
): Promise<void> {
  const c = await loadCase(supabase, job.case_id);
  if (!c) return;
  if (automationBlocked(c)) return;
  // Only remind while still waiting on the organisme.
  if (c.status !== "waiting_for_organization") return;

  const config = await loadRemindersConfig(supabase);
  const index = Number((job.payload as { index?: number })?.index ?? 0);

  // Respect the max reminders cap → escalate to human review instead of spamming.
  if (c.reminder_count >= config.max_reminders) {
    if (canTransition(c.status, "human_review_required")) {
      await supabase
        .from("cases")
        .update({ status: "human_review_required", human_review_required: true })
        .eq("id", c.id);
      await supabase.from("case_timeline").insert({
        case_id: c.id,
        event_type: "escalated",
        title: "Escalade — revue humaine",
        description: `Aucune réponse après ${config.max_reminders} relances.`,
        old_status: c.status,
        new_status: "human_review_required",
        source: "automation",
      });
    }
    return;
  }

  const res = await performCaseSend(supabase, c, {
    kind: "reminder",
    actor: "automation",
  });
  if (res.blocked) return;
  if (res.error) throw new Error(res.error);

  // Schedule the next reminder if any remain.
  const nextIndex = index + 1;
  const runAt = nextReminderAt(new Date(), nextIndex, config);
  if (runAt) {
    await enqueueJob(supabase, {
      caseId: c.id,
      jobType: "send_reminder",
      runAt,
      idempotencyKey: `reminder:${c.id}:${nextIndex}`,
      payload: { index: nextIndex },
    });
  }
}

async function handlePaymentDueCheck(
  supabase: SupabaseClient,
  job: WorkflowJob,
): Promise<void> {
  const c = await loadCase(supabase, job.case_id);
  if (!c) return;
  if (isTerminal(c.status) || c.status === "paid") return;
  if (!["payment_promised", "payment_due"].includes(c.status)) return;

  // The promised date has arrived and no payment was confirmed → overdue.
  if (canTransition(c.status, "payment_overdue")) {
    await supabase
      .from("cases")
      .update({ status: "payment_overdue" })
      .eq("id", c.id);
    await supabase.from("case_timeline").insert({
      case_id: c.id,
      event_type: "payment_overdue",
      title: "Paiement promis non reçu",
      description: "La date de paiement annoncée est dépassée sans règlement confirmé.",
      old_status: c.status,
      new_status: "payment_overdue",
      source: "automation",
    });
  }
}

const HANDLERS: Record<
  JobType,
  (supabase: SupabaseClient, job: WorkflowJob) => Promise<void>
> = {
  send_first_contact: handleFirstContact,
  send_reminder: handleReminder,
  payment_due_check: handlePaymentDueCheck,
};

/* ------------------------------ processing -------------------------------- */

export interface ProcessResult {
  processed: number;
  completed: number;
  failed: number;
  rescheduled: number;
}

const BACKOFF_MINUTES = [1, 5, 15, 60, 180];

/**
 * Process due jobs. Each job is claimed (status→running with an attempt guard),
 * executed by its handler, then marked completed or retried with backoff up to
 * max_attempts. Domain-level idempotency lives in the handlers (they re-check
 * the case state), so a job that runs twice is safe.
 */
export async function processDueJobs(
  supabase: SupabaseClient,
  options: { limit?: number } = {},
): Promise<ProcessResult> {
  const limit = options.limit ?? 25;
  const nowIso = new Date().toISOString();

  const { data: due } = await supabase
    .from("workflow_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("run_at", nowIso)
    .order("run_at", { ascending: true })
    .limit(limit);

  const jobs = (due as WorkflowJob[] | null) ?? [];
  const result: ProcessResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    rescheduled: 0,
  };

  for (const job of jobs) {
    // Claim the job: flip pending→running only if still pending (optimistic lock).
    const { data: claimed } = await supabase
      .from("workflow_jobs")
      .update({ status: "running", attempts: job.attempts + 1 })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle<{ id: string }>();
    if (!claimed) continue; // someone else took it

    result.processed++;
    const handler = HANDLERS[job.job_type as JobType];

    if (!handler) {
      await supabase
        .from("workflow_jobs")
        .update({ status: "failed", last_error: `Unknown job type: ${job.job_type}` })
        .eq("id", job.id);
      result.failed++;
      continue;
    }

    try {
      await handler(supabase, { ...job, attempts: job.attempts + 1 });
      await supabase
        .from("workflow_jobs")
        .update({ status: "completed", last_error: null })
        .eq("id", job.id);
      result.completed++;
    } catch (e) {
      const attempts = job.attempts + 1;
      const message = (e as Error).message?.slice(0, 300) ?? "error";
      if (attempts >= job.max_attempts) {
        await supabase
          .from("workflow_jobs")
          .update({ status: "failed", last_error: message })
          .eq("id", job.id);
        result.failed++;
      } else {
        const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
        const runAt = new Date(Date.now() + backoff * 60_000).toISOString();
        await supabase
          .from("workflow_jobs")
          .update({ status: "pending", last_error: message, run_at: runAt })
          .eq("id", job.id);
        result.rescheduled++;
      }
    }
  }

  return result;
}
