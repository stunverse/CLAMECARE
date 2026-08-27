/**
 * MyDueGuard domain enums — mirrors the Postgres enums in
 * supabase/migrations/0009_claimguard_cases.sql. French UI labels (target
 * market: independent trainers in France).
 */

export type StatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

/* ------------------------------- case status ------------------------------ */
export const CASE_STATUSES = [
  "draft",
  "under_analysis",
  "missing_information",
  "ready_to_contact",
  "first_contact_sent",
  "waiting_for_organization",
  "document_requested",
  "client_action_required",
  "in_discussion",
  "payment_promised",
  "payment_due",
  "payment_overdue",
  "disputed",
  "human_review_required",
  "paid",
  "closed",
  "cancelled",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  draft: "Brouillon",
  under_analysis: "En analyse",
  missing_information: "Informations manquantes",
  ready_to_contact: "Prêt à contacter",
  first_contact_sent: "Premier contact envoyé",
  waiting_for_organization: "En attente du client",
  document_requested: "Document demandé",
  client_action_required: "Action requise",
  in_discussion: "En discussion",
  payment_promised: "Paiement promis",
  payment_due: "Paiement dû",
  payment_overdue: "Paiement en retard",
  disputed: "Contesté",
  human_review_required: "Revue humaine",
  paid: "Réglé",
  closed: "Clôturé",
  cancelled: "Annulé",
};

export const CASE_STATUS_VARIANT: Record<CaseStatus, StatusVariant> = {
  draft: "muted",
  under_analysis: "info",
  missing_information: "warning",
  ready_to_contact: "info",
  first_contact_sent: "default",
  waiting_for_organization: "warning",
  document_requested: "warning",
  client_action_required: "danger",
  in_discussion: "default",
  payment_promised: "info",
  payment_due: "info",
  payment_overdue: "danger",
  disputed: "danger",
  human_review_required: "warning",
  paid: "success",
  closed: "muted",
  cancelled: "muted",
};

/** Statuses that count as "active" (still being worked). */
export const ACTIVE_CASE_STATUSES: CaseStatus[] = CASE_STATUSES.filter(
  (s) => !["paid", "closed", "cancelled"].includes(s),
);

/* ------------------------------- risk level ------------------------------- */
export const CASE_RISK_LEVELS = ["low", "medium", "high"] as const;
export type CaseRiskLevel = (typeof CASE_RISK_LEVELS)[number];
export const CASE_RISK_LABELS: Record<CaseRiskLevel, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
};

/* ------------------------- automation action level ------------------------ */
export const AUTOMATION_LEVELS = ["auto", "review", "forbidden"] as const;
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number];

/* --------------------------- document category ---------------------------- */
export const CASE_DOCUMENT_CATEGORIES = [
  "invoice",
  "convention",
  "subcontract",
  "purchase_order",
  "attendance_sheet",
  "completion_certificate",
  "program",
  "email",
  "screenshot",
  "other",
] as const;
export type CaseDocumentCategory = (typeof CASE_DOCUMENT_CATEGORIES)[number];
export const CASE_DOCUMENT_CATEGORY_LABELS: Record<
  CaseDocumentCategory,
  string
> = {
  invoice: "Facture",
  convention: "Contrat / convention",
  subcontract: "Contrat de sous-traitance",
  purchase_order: "Bon de commande",
  attendance_sheet: "Feuille de temps / présence",
  completion_certificate: "Attestation / preuve de réalisation",
  program: "Devis / cahier des charges",
  email: "Email",
  screenshot: "Capture d'écran",
  other: "Autre",
};

/* ----------------------------- email category ----------------------------- */
export const EMAIL_CATEGORIES = [
  "payment_confirmed",
  "payment_date_given",
  "document_missing",
  "invoice_not_received",
  "invoice_rejected",
  "wrong_invoice",
  "purchase_order_missing",
  "waiting_internal_approval",
  "accounting_processing",
  "dispute",
  "request_information",
  "out_of_office",
  "unknown",
] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  payment_confirmed: "Paiement confirmé",
  payment_date_given: "Date de paiement annoncée",
  document_missing: "Document manquant",
  invoice_not_received: "Facture non reçue",
  invoice_rejected: "Facture rejetée",
  wrong_invoice: "Facture erronée",
  purchase_order_missing: "Bon de commande manquant",
  waiting_internal_approval: "En attente de validation interne",
  accounting_processing: "Traitement comptable en cours",
  dispute: "Litige / contestation",
  request_information: "Demande d'information",
  out_of_office: "Absence (auto-reply)",
  unknown: "Non classé",
};

export const EMAIL_DIRECTIONS = ["inbound", "outbound"] as const;
export type EmailDirection = (typeof EMAIL_DIRECTIONS)[number];

export const EMAIL_MESSAGE_STATUSES = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "failed",
  "received",
] as const;
export type EmailMessageStatus = (typeof EMAIL_MESSAGE_STATUSES)[number];

/* ------------------------------ workflow jobs ----------------------------- */
export const WORKFLOW_JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type WorkflowJobStatus = (typeof WORKFLOW_JOB_STATUSES)[number];

/* ------------------------------ event source ------------------------------ */
export const CASE_EVENT_SOURCES = [
  "automation",
  "ai",
  "admin",
  "agent",
  "client",
  "system",
] as const;
export type CaseEventSource = (typeof CASE_EVENT_SOURCES)[number];

/* ------------------------------ payment type ------------------------------ */
export const PAYMENT_TYPES = ["full", "partial"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const CASE_ANALYSIS_STATUSES = [
  "uploaded",
  "processing",
  "analyzed",
  "failed",
] as const;
export type CaseAnalysisStatus = (typeof CASE_ANALYSIS_STATUSES)[number];

/* ------------------------ completeness score bands ------------------------ */
export function completenessBand(score: number | null): {
  label: string;
  variant: StatusVariant;
} {
  if (score === null) return { label: "Non évalué", variant: "muted" };
  if (score >= 90) return { label: "Dossier complet", variant: "success" };
  if (score >= 70) return { label: "Dossier exploitable", variant: "info" };
  if (score >= 40)
    return { label: "Informations à compléter", variant: "warning" };
  return { label: "Dossier insuffisant", variant: "danger" };
}
