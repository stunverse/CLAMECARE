import type { CaseStatus } from "@/lib/claimguard/enums";

/**
 * Deterministic case state machine (cahier des charges §9/§28).
 * The workflow engine and server actions must only move a case through an
 * allowed transition. Staff may override via a dedicated admin path.
 */
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  draft: ["under_analysis", "cancelled"],
  under_analysis: [
    "missing_information",
    "ready_to_contact",
    "human_review_required",
  ],
  missing_information: [
    "under_analysis",
    "ready_to_contact",
    "client_action_required",
    "cancelled",
  ],
  ready_to_contact: ["first_contact_sent", "human_review_required", "cancelled"],
  first_contact_sent: ["waiting_for_organization"],
  waiting_for_organization: [
    "in_discussion",
    "document_requested",
    "payment_promised",
    "payment_overdue",
    "disputed",
    "human_review_required",
    "waiting_for_organization", // reminder loop
    "paid",
  ],
  document_requested: [
    "client_action_required",
    "in_discussion",
    "waiting_for_organization",
  ],
  client_action_required: [
    "in_discussion",
    "waiting_for_organization",
    "document_requested",
  ],
  in_discussion: [
    "payment_promised",
    "document_requested",
    "disputed",
    "human_review_required",
    "waiting_for_organization",
    "paid",
  ],
  payment_promised: ["payment_due", "paid", "payment_overdue", "in_discussion"],
  payment_due: ["paid", "payment_overdue"],
  payment_overdue: [
    "in_discussion",
    "payment_promised",
    "paid",
    "human_review_required",
    "disputed",
  ],
  disputed: ["human_review_required", "in_discussion", "closed"],
  human_review_required: [
    "in_discussion",
    "waiting_for_organization",
    "disputed",
    "payment_promised",
    "closed",
    "cancelled",
  ],
  paid: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export const TERMINAL_STATUSES: CaseStatus[] = ["closed", "cancelled"];

export function isTerminal(status: CaseStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
