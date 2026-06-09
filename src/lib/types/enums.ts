/**
 * TypeScript mirror of the Postgres enums defined in
 * supabase/migrations/0001_init.sql.
 *
 * Each enum is exported as a readonly `as const` array (handy for dropdowns,
 * validation, and iteration) plus a derived union type. Keep this file in sync
 * with the SQL enums — they are the single source of truth.
 */

export const USER_ROLES = ["user", "admin", "expert", "attorney"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const INSURANCE_TYPES = [
  "health",
  "auto",
  "homeowners",
  "renters",
  "travel",
  "life",
  "disability",
  "business",
  "pet",
  "other",
] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const ISSUE_TYPES = [
  "claim_denied",
  "claim_delayed",
  "payout_too_low",
  "more_documents_requested",
  "dont_understand_decision",
  "want_to_appeal",
  "want_to_file_complaint",
  "need_policy_help",
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const CLAIM_STATUSES = [
  "draft",
  "documents_missing",
  "ready_for_analysis",
  "ai_analysis_completed",
  "ready_to_send",
  "sent_to_insurer",
  "waiting_for_response",
  "response_received",
  "in_appeal",
  "escalated",
  "complaint_prepared",
  "complaint_filed",
  "resolved",
  "abandoned",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const PRIORITY_LEVELS = ["low", "medium", "high", "urgent"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const DENIAL_REASONS = [
  "coverage_exclusion",
  "missing_documentation",
  "late_filing",
  "policy_lapse",
  "pre_existing_condition",
  "lack_of_medical_necessity",
  "insufficient_evidence",
  "damage_not_covered",
  "wear_and_tear",
  "fraud_suspicion",
  "administrative_error",
  "duplicate_claim",
  "out_of_network",
  "deductible_not_met",
  "policy_limit_reached",
  "other",
] as const;
export type DenialReason = (typeof DENIAL_REASONS)[number];

export const DOCUMENT_CATEGORIES = [
  "denial_letter",
  "insurance_policy",
  "policy_declaration",
  "invoice",
  "receipt",
  "photo_evidence",
  "video_evidence",
  "medical_bill",
  "medical_record",
  "repair_estimate",
  "police_report",
  "accident_report",
  "email_from_insurer",
  "letter_from_insurer",
  "bank_statement",
  "proof_of_payment",
  "contract",
  "screenshot",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const ANALYSIS_STATUSES = [
  "uploaded",
  "processing",
  "analyzed",
  "failed",
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const EVIDENCE_IMPORTANCE = [
  "critical",
  "important",
  "helpful",
  "optional",
] as const;
export type EvidenceImportance = (typeof EVIDENCE_IMPORTANCE)[number];

export const EVIDENCE_STATUSES = [
  "missing",
  "uploaded",
  "reviewed",
  "not_applicable",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const TIMELINE_EVENT_TYPES = [
  "incident_occurred",
  "claim_filed",
  "documents_submitted",
  "info_requested",
  "denial_received",
  "appeal_submitted",
  "follow_up_sent",
  "complaint_prepared",
  "complaint_filed",
  "settlement_offer_received",
  "claim_resolved",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const GENERATED_DOCUMENT_TYPES = [
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
  "claim_summary",
  "evidence_summary",
  "timeline_summary",
  "appeal_packet",
  "complaint_packet",
  "attorney_summary",
  "negotiation_brief",
  "call_preparation_sheet",
] as const;
export type GeneratedDocumentType = (typeof GENERATED_DOCUMENT_TYPES)[number];

export const DOCUMENT_TONES = [
  "professional",
  "firm",
  "conciliatory",
  "urgent",
  "legal_accessible",
] as const;
export type DocumentTone = (typeof DOCUMENT_TONES)[number];

export const GENERATED_DOCUMENT_STATUSES = [
  "draft",
  "final",
  "sent",
  "archived",
] as const;
export type GeneratedDocumentStatus =
  (typeof GENERATED_DOCUMENT_STATUSES)[number];

export const COMPLAINT_STATUSES = [
  "not_started",
  "draft_prepared",
  "submitted",
  "under_review",
  "response_received",
  "closed",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const CHAT_ROLES = ["user", "assistant", "system"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const EXPERT_REVIEW_TYPES = [
  "appeal_letter",
  "evidence_packet",
  "claim_strategy",
  "complaint",
] as const;
export type ExpertReviewType = (typeof EXPERT_REVIEW_TYPES)[number];

export const EXPERT_REVIEW_STATUSES = [
  "requested",
  "assigned",
  "in_review",
  "completed",
  "needs_user_action",
] as const;
export type ExpertReviewStatus = (typeof EXPERT_REVIEW_STATUSES)[number];

export const REFERRAL_STATUSES = [
  "pending",
  "consent_given",
  "shared",
  "contacted",
  "closed",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "deadline_approaching",
  "missing_documents",
  "appeal_letter_ready",
  "ai_analysis_complete",
  "complaint_draft_ready",
  "expert_review_completed",
  "claim_status_updated",
  "subscription_issue",
  "payment_failed",
  "weekly_summary",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUBSCRIPTION_PLANS = [
  "starter",
  "plus",
  "pro",
  "premium",
] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "unpaid",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const KNOWLEDGE_CATEGORIES = [
  "state_regulation",
  "company_playbook",
  "insurance_type_guide",
  "denial_reason",
  "evidence_checklist",
  "letter_template",
  "glossary",
  "faq",
] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const CONSENT_TYPE_VALUES = [
  "terms_of_service",
  "privacy_policy",
  "legal_disclaimer",
  "sensitive_document_processing",
] as const;
export type ConsentType = (typeof CONSENT_TYPE_VALUES)[number];

export const USAGE_EVENT_TYPES = [
  "ai_analysis",
  "document_generated",
  "document_uploaded",
  "pdf_export",
  "complaint_generated",
  "expert_review_requested",
] as const;
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];
