import type {
  CaseStatus,
  CaseRiskLevel,
  CaseDocumentCategory,
  CaseAnalysisStatus,
  EmailDirection,
  EmailCategory,
  EmailMessageStatus,
  WorkflowJobStatus,
  CaseEventSource,
  PaymentType,
} from "@/lib/claimguard/enums";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  legal_name: string | null;
  siret: string | null;
  address: string | null;
  general_email: string | null;
  accounting_email: string | null;
  phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  case_reference: string;
  organization_id: string | null;

  debtor_name: string | null;
  debtor_email: string | null;
  debtor_accounting_email: string | null;
  debtor_contact_name: string | null;
  debtor_contact_email: string | null;
  debtor_phone: string | null;
  payer_phone: string | null;

  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_ht: number | null;
  vat_amount: number | null;
  original_amount: number | null;
  remaining_amount: number | null;
  currency: string;
  service_description: string | null;

  payee_name: string | null;
  iban: string | null;
  bic: string | null;

  status: CaseStatus;
  risk_level: CaseRiskLevel;
  completeness_score: number | null;
  promised_payment_date: string | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  automation_enabled: boolean;
  human_review_required: boolean;
  reminder_count: number;

  ai_summary: string | null;
  ai_analysis: Json | null;
  client_history: string | null;

  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  user_id: string;
  case_id: string;
  file_name: string;
  file_url: string | null;
  file_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  document_category: CaseDocumentCategory;
  extracted_text: string | null;
  ai_summary: string | null;
  extracted_fields: Json;
  analysis_status: CaseAnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface EmailThread {
  id: string;
  case_id: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  case_id: string;
  thread_id: string | null;
  direction: EmailDirection;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body: string | null;
  category: EmailCategory | null;
  confidence: number | null;
  status: EmailMessageStatus;
  external_id: string | null;
  ai_generated: boolean;
  requires_review: boolean;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
}

export interface CaseTimelineEntry {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description: string | null;
  old_status: CaseStatus | null;
  new_status: CaseStatus | null;
  source: CaseEventSource;
  metadata: Json;
  created_at: string;
}

export interface WorkflowJob {
  id: string;
  case_id: string;
  job_type: string;
  status: WorkflowJobStatus;
  run_at: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  idempotency_key: string | null;
  payload: Json;
  created_at: string;
  updated_at: string;
}

export interface PaymentPromise {
  id: string;
  case_id: string;
  promised_date: string;
  amount: number | null;
  source_email_id: string | null;
  created_at: string;
}

export interface PaymentConfirmation {
  id: string;
  case_id: string;
  user_id: string;
  amount: number | null;
  paid_at: string | null;
  payment_type: PaymentType;
  remaining_after: number | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  case_id: string | null;
  action: string;
  source: CaseEventSource;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
}
