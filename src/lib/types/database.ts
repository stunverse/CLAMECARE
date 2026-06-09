/**
 * TypeScript row shapes mirroring the tables in
 * supabase/migrations/0002_tables.sql.
 *
 * Conventions:
 *   - uuid / timestamptz / date columns are typed as `string` (ISO strings)
 *   - numeric / integer columns are typed as `number`
 *   - jsonb columns are typed as `Json` (refine per-feature as needed)
 *
 * Keep in sync with the SQL schema. Once a Supabase project exists, these can
 * be replaced/augmented by `supabase gen types typescript`.
 */
import type {
  AnalysisStatus,
  ChatRole,
  ClaimStatus,
  ComplaintStatus,
  ConsentType,
  DenialReason,
  DocumentCategory,
  DocumentTone,
  EvidenceImportance,
  EvidenceStatus,
  ExpertReviewStatus,
  ExpertReviewType,
  GeneratedDocumentStatus,
  GeneratedDocumentType,
  InsuranceType,
  IssueType,
  KnowledgeCategory,
  MessageDirection,
  NotificationType,
  PriorityLevel,
  ReferralStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SupportTicketStatus,
  TimelineEventType,
  UsageEventType,
  UserRole,
} from "./enums";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  state: string | null;
  country: string;
  preferred_language: string;
  legal_disclaimer_accepted_at: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  user_id: string;
  claim_title: string;
  insurance_type: InsuranceType | null;
  issue_type: IssueType | null;
  insurance_company: string | null;
  state: string | null;
  incident_state: string | null;
  policy_number: string | null;
  claim_number: string | null;
  adjuster_name: string | null;
  adjuster_email: string | null;
  adjuster_phone: string | null;
  amount_claimed: number | null;
  amount_offered: number | null;
  amount_paid: number | null;
  estimated_loss: number | null;
  deductible: number | null;
  incident_date: string | null;
  claim_filed_date: string | null;
  denial_date: string | null;
  last_response_date: string | null;
  appeal_deadline: string | null;
  user_summary: string | null;
  ai_summary: string | null;
  detected_denial_reason: DenialReason | null;
  current_status: ClaimStatus;
  priority_level: PriorityLevel;
  success_score: number | null;
  evidence_score: number | null;
  policy_score: number | null;
  timeline_score: number | null;
  consistency_score: number | null;
  negotiation_score: number | null;
  risk_score: number | null;
  /** Full structured analyzeClaim() result (see src/lib/ai/types.ts). */
  ai_analysis: Json | null;
  /** Full structured analyzePolicy() result (see src/lib/ai/policy.ts). */
  policy_analysis: Json | null;
  /** Full structured negotiation result (see src/lib/ai/negotiation.ts). */
  negotiation_analysis: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimDocument {
  id: string;
  user_id: string;
  claim_id: string;
  file_name: string;
  file_url: string | null;
  file_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  document_category: DocumentCategory;
  extracted_text: string | null;
  ai_summary: string | null;
  extracted_dates: Json;
  extracted_amounts: Json;
  extracted_entities: Json;
  analysis_status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: string;
  claim_id: string;
  title: string;
  description: string | null;
  category: string | null;
  importance: EvidenceImportance;
  status: EvidenceStatus;
  linked_document_id: string | null;
  ai_reason: string | null;
  how_to_get_it: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  claim_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_type: TimelineEventType | null;
  source_document_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  id: string;
  user_id: string;
  claim_id: string;
  document_type: GeneratedDocumentType;
  title: string;
  content: string | null;
  tone: DocumentTone;
  status: GeneratedDocumentStatus;
  pdf_url: string | null;
  docx_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  claim_id: string;
  user_id: string;
  state: string | null;
  regulator_name: string | null;
  complaint_text: string | null;
  status: ComplaintStatus;
  submitted_at: string | null;
  response_received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  claim_id: string;
  user_id: string;
  direction: MessageDirection;
  sender: string | null;
  recipient: string | null;
  subject: string | null;
  body: string | null;
  ai_summary: string | null;
  detected_deadlines: Json;
  detected_requests: Json;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessage {
  id: string;
  claim_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ExpertReview {
  id: string;
  claim_id: string;
  user_id: string;
  expert_id: string | null;
  review_type: ExpertReviewType;
  status: ExpertReviewStatus;
  user_note: string | null;
  expert_summary: string | null;
  expert_recommendations: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AttorneyReferral {
  id: string;
  claim_id: string;
  user_id: string;
  attorney_name: string | null;
  attorney_email: string | null;
  state: string | null;
  practice_area: string | null;
  referral_status: ReferralStatus;
  user_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimLibraryItem {
  id: string;
  title: string;
  category: KnowledgeCategory | null;
  insurance_type: InsuranceType | null;
  state: string | null;
  company: string | null;
  content: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  claim_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string | null;
  status: SupportTicketStatus;
  priority: PriorityLevel;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageLimit {
  id: string;
  user_id: string;
  plan_name: SubscriptionPlan;
  active_claims_limit: number | null;
  documents_limit: number | null;
  ai_analysis_limit: number | null;
  generated_documents_limit: number | null;
  storage_limit_mb: number | null;
  expert_reviews_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: UsageEventType;
  claim_id: string | null;
  quantity: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  claim_id: string | null;
  action_type: string;
  action_description: string | null;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  consent_text: string | null;
  accepted_at: string;
  ip_address: string | null;
  created_at: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  category: KnowledgeCategory | null;
  content: string | null;
  source_url: string | null;
  state: string | null;
  insurance_type: InsuranceType | null;
  company: string | null;
  tags: string[];
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseChunk {
  id: string;
  entry_id: string;
  chunk_text: string;
  /** pgvector embedding — number[] when fetched as JSON; null until embedded. */
  embedding: number[] | null;
  metadata: Json;
  created_at: string;
}

export interface StateRegulation {
  id: string;
  state_code: string;
  state_name: string;
  department_name: string | null;
  complaint_url: string | null;
  phone: string | null;
  email: string | null;
  mailing_address: string | null;
  general_rules: string | null;
  claim_handling_deadlines: string | null;
  complaint_instructions: string | null;
  last_verified_at: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  website: string | null;
  claims_url: string | null;
  appeals_url: string | null;
  customer_service_phone: string | null;
  mailing_address: string | null;
  supported_insurance_types: InsuranceType[];
  common_denial_reasons: string[];
  recommended_documents: string[];
  escalation_steps: string | null;
  notes: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  granted_by: string | null;
  notes: string | null;
  created_at: string;
}
