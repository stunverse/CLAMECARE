/**
 * Human-readable labels and badge variants for enum values.
 *
 * The DB stores snake_case enum values; the UI shows these friendly labels.
 * Keep keys in sync with src/lib/types/enums.ts.
 */
import type {
  ClaimStatus,
  ComplaintStatus,
  DenialReason,
  DocumentCategory,
  DocumentTone,
  EvidenceImportance,
  EvidenceStatus,
  GeneratedDocumentType,
  InsuranceType,
  IssueType,
  KnowledgeCategory,
  PriorityLevel,
  SubscriptionPlan,
  SupportTicketStatus,
  TimelineEventType,
} from "@/lib/types/enums";

/** Subset of badge variants used for status coloring. */
export type StatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  health: "Health insurance",
  auto: "Auto insurance",
  homeowners: "Homeowners insurance",
  renters: "Renters insurance",
  travel: "Travel insurance",
  life: "Life insurance",
  disability: "Disability insurance",
  business: "Business insurance",
  pet: "Pet insurance",
  other: "Other insurance",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  claim_denied: "My claim was denied",
  claim_delayed: "My claim is delayed",
  payout_too_low: "The payout offer is too low",
  more_documents_requested: "My insurer is asking for more documents",
  dont_understand_decision: "I don't understand the decision",
  want_to_appeal: "I want to appeal",
  want_to_file_complaint: "I want to file a complaint",
  need_policy_help: "I need help understanding my policy",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  draft: "Draft",
  documents_missing: "Documents missing",
  ready_for_analysis: "Ready for analysis",
  ai_analysis_completed: "AI analysis completed",
  ready_to_send: "Ready to send",
  sent_to_insurer: "Sent to insurer",
  waiting_for_response: "Waiting for insurer response",
  response_received: "Response received",
  in_appeal: "In appeal",
  escalated: "Escalated",
  complaint_prepared: "Complaint prepared",
  complaint_filed: "Complaint filed",
  resolved: "Resolved",
  abandoned: "Abandoned",
};

export const CLAIM_STATUS_VARIANT: Record<ClaimStatus, StatusVariant> = {
  draft: "muted",
  documents_missing: "warning",
  ready_for_analysis: "info",
  ai_analysis_completed: "info",
  ready_to_send: "info",
  sent_to_insurer: "default",
  waiting_for_response: "warning",
  response_received: "info",
  in_appeal: "default",
  escalated: "warning",
  complaint_prepared: "warning",
  complaint_filed: "default",
  resolved: "success",
  abandoned: "muted",
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  not_started: "Not started",
  draft_prepared: "Draft prepared",
  submitted: "Submitted",
  under_review: "Under review",
  response_received: "Response received",
  closed: "Closed",
};

export const COMPLAINT_STATUS_VARIANT: Record<ComplaintStatus, StatusVariant> = {
  not_started: "muted",
  draft_prepared: "info",
  submitted: "default",
  under_review: "warning",
  response_received: "info",
  closed: "success",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> =
  {
    open: "Open",
    in_progress: "In progress",
    waiting_for_user: "Waiting for you",
    resolved: "Resolved",
    closed: "Closed",
  };

export const SUPPORT_TICKET_STATUS_VARIANT: Record<
  SupportTicketStatus,
  StatusVariant
> = {
  open: "info",
  in_progress: "warning",
  waiting_for_user: "warning",
  resolved: "success",
  closed: "muted",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_VARIANT: Record<PriorityLevel, StatusVariant> = {
  low: "muted",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export const DENIAL_REASON_LABELS: Record<DenialReason, string> = {
  coverage_exclusion: "Coverage exclusion",
  missing_documentation: "Missing documentation",
  late_filing: "Late filing",
  policy_lapse: "Policy lapse",
  pre_existing_condition: "Pre-existing condition",
  lack_of_medical_necessity: "Lack of medical necessity",
  insufficient_evidence: "Insufficient evidence",
  damage_not_covered: "Damage not covered",
  wear_and_tear: "Wear and tear",
  fraud_suspicion: "Fraud suspicion",
  administrative_error: "Administrative error",
  duplicate_claim: "Duplicate claim",
  out_of_network: "Out-of-network issue",
  deductible_not_met: "Deductible not met",
  policy_limit_reached: "Policy limit reached",
  other: "Other",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  denial_letter: "Denial letter",
  insurance_policy: "Insurance policy",
  policy_declaration: "Policy declaration page",
  invoice: "Invoice",
  receipt: "Receipt",
  photo_evidence: "Photo evidence",
  video_evidence: "Video evidence",
  medical_bill: "Medical bill",
  medical_record: "Medical record",
  repair_estimate: "Repair estimate",
  police_report: "Police report",
  accident_report: "Accident report",
  email_from_insurer: "Email from insurer",
  letter_from_insurer: "Letter from insurer",
  bank_statement: "Bank statement",
  proof_of_payment: "Proof of payment",
  contract: "Contract",
  screenshot: "Screenshot",
  other: "Other",
};

export const EVIDENCE_IMPORTANCE_LABELS: Record<EvidenceImportance, string> = {
  critical: "Critical",
  important: "Important",
  helpful: "Helpful",
  optional: "Optional",
};

export const EVIDENCE_IMPORTANCE_VARIANT: Record<
  EvidenceImportance,
  StatusVariant
> = {
  critical: "danger",
  important: "warning",
  helpful: "info",
  optional: "muted",
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  reviewed: "Reviewed",
  not_applicable: "Not applicable",
};

export const EVIDENCE_STATUS_VARIANT: Record<EvidenceStatus, StatusVariant> = {
  missing: "danger",
  uploaded: "info",
  reviewed: "success",
  not_applicable: "muted",
};

export const GENERATED_DOCUMENT_TYPE_LABELS: Record<
  GeneratedDocumentType,
  string
> = {
  appeal_letter: "Appeal letter",
  request_reconsideration: "Request for reconsideration",
  request_explanation: "Request for explanation",
  request_claim_file: "Request for claim file copy",
  request_reopen_claim: "Request to reopen claim",
  demand_letter: "Demand letter",
  follow_up_letter: "Follow-up letter",
  letter_to_adjuster: "Letter to adjuster",
  letter_to_claim_manager: "Letter to claim manager",
  complaint_letter: "Complaint letter to Department of Insurance",
  request_independent_review: "Request for independent review",
  negotiation_letter: "Negotiation letter",
  counteroffer_letter: "Counteroffer letter",
  claim_summary: "Claim summary",
  evidence_summary: "Evidence summary",
  timeline_summary: "Timeline summary",
  appeal_packet: "Appeal packet",
  complaint_packet: "Complaint packet",
  attorney_summary: "Attorney summary",
  negotiation_brief: "Negotiation brief",
  call_preparation_sheet: "Call preparation sheet",
};

export const TIMELINE_EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  incident_occurred: "Incident occurred",
  claim_filed: "Claim filed",
  documents_submitted: "Documents submitted",
  info_requested: "Insurer requested information",
  denial_received: "Denial received",
  appeal_submitted: "Appeal submitted",
  follow_up_sent: "Follow-up sent",
  complaint_prepared: "Complaint prepared",
  complaint_filed: "Complaint filed",
  settlement_offer_received: "Settlement offer received",
  claim_resolved: "Claim resolved",
};

export const DOCUMENT_TONE_LABELS: Record<DocumentTone, string> = {
  professional: "Professional",
  firm: "Firm",
  conciliatory: "Conciliatory",
  urgent: "Urgent",
  legal_accessible: "Legal but accessible",
};

/** Letter-type generated documents (excludes packets/briefs). */
export const LETTER_DOCUMENT_TYPES: GeneratedDocumentType[] = [
  "appeal_letter",
  "request_reconsideration",
  "request_explanation",
  "request_claim_file",
  "request_reopen_claim",
  "demand_letter",
  "follow_up_letter",
  "letter_to_adjuster",
  "letter_to_claim_manager",
  "complaint_letter",
  "request_independent_review",
  "negotiation_letter",
  "counteroffer_letter",
];

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  state_regulation: "State guide",
  company_playbook: "Company playbook",
  insurance_type_guide: "Insurance guide",
  denial_reason: "Denial reason",
  evidence_checklist: "Evidence checklist",
  letter_template: "Letter template",
  glossary: "Glossary",
  faq: "FAQ",
};

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
  premium: "Premium",
};

/** Score band (cahier des charges §15): Weak / Moderate / Strong / Very strong. */
export function getScoreBand(score: number): {
  label: "Weak" | "Moderate" | "Strong" | "Very strong";
  variant: StatusVariant;
} {
  if (score >= 80) return { label: "Very strong", variant: "success" };
  if (score >= 60) return { label: "Strong", variant: "success" };
  if (score >= 40) return { label: "Moderate", variant: "warning" };
  return { label: "Weak", variant: "danger" };
}

/** Generic fallback: turn any snake_case enum value into a readable label. */
export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
