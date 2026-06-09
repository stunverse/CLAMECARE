-- ============================================================================
-- ClaimCare AI — Initial database schema
-- ============================================================================
-- Covers the full data model (cahier des charges §37): all core + premium
-- tables, Postgres enums, Row Level Security, indexes, and triggers.
--
-- Premium / future modules get real tables + structure now (no feature is
-- dropped) so they can be wired up later without reworking the schema.
--
-- Apply with the Supabase CLI:  supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;     -- RAG-ready embeddings (pgvector)

-- Helper functions below reference tables created in 0002_tables.sql. Disable
-- function-body validation so they can be created ahead of those tables
-- (standard Supabase migration ordering; bodies are validated at runtime).
set check_function_bodies = off;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('user', 'admin', 'expert', 'attorney');

create type insurance_type as enum (
  'health', 'auto', 'homeowners', 'renters', 'travel',
  'life', 'disability', 'business', 'pet', 'other'
);

create type issue_type as enum (
  'claim_denied', 'claim_delayed', 'payout_too_low', 'more_documents_requested',
  'dont_understand_decision', 'want_to_appeal', 'want_to_file_complaint',
  'need_policy_help'
);

create type claim_status as enum (
  'draft', 'documents_missing', 'ready_for_analysis', 'ai_analysis_completed',
  'ready_to_send', 'sent_to_insurer', 'waiting_for_response', 'response_received',
  'in_appeal', 'escalated', 'complaint_prepared', 'complaint_filed',
  'resolved', 'abandoned'
);

create type priority_level as enum ('low', 'medium', 'high', 'urgent');

create type denial_reason as enum (
  'coverage_exclusion', 'missing_documentation', 'late_filing', 'policy_lapse',
  'pre_existing_condition', 'lack_of_medical_necessity', 'insufficient_evidence',
  'damage_not_covered', 'wear_and_tear', 'fraud_suspicion', 'administrative_error',
  'duplicate_claim', 'out_of_network', 'deductible_not_met', 'policy_limit_reached',
  'other'
);

create type document_category as enum (
  'denial_letter', 'insurance_policy', 'policy_declaration', 'invoice', 'receipt',
  'photo_evidence', 'video_evidence', 'medical_bill', 'medical_record',
  'repair_estimate', 'police_report', 'accident_report', 'email_from_insurer',
  'letter_from_insurer', 'bank_statement', 'proof_of_payment', 'contract',
  'screenshot', 'other'
);

create type analysis_status as enum ('uploaded', 'processing', 'analyzed', 'failed');

create type evidence_importance as enum ('critical', 'important', 'helpful', 'optional');

create type evidence_status as enum ('missing', 'uploaded', 'reviewed', 'not_applicable');

create type timeline_event_type as enum (
  'incident_occurred', 'claim_filed', 'documents_submitted', 'info_requested',
  'denial_received', 'appeal_submitted', 'follow_up_sent', 'complaint_prepared',
  'complaint_filed', 'settlement_offer_received', 'claim_resolved'
);

create type generated_document_type as enum (
  -- Letters
  'appeal_letter', 'request_reconsideration', 'request_explanation',
  'request_claim_file', 'request_reopen_claim', 'demand_letter', 'follow_up_letter',
  'letter_to_adjuster', 'letter_to_claim_manager', 'complaint_letter',
  'request_independent_review', 'negotiation_letter', 'counteroffer_letter',
  -- Packets / briefs
  'claim_summary', 'evidence_summary', 'timeline_summary', 'appeal_packet',
  'complaint_packet', 'attorney_summary', 'negotiation_brief', 'call_preparation_sheet'
);

create type document_tone as enum (
  'professional', 'firm', 'conciliatory', 'urgent', 'legal_accessible'
);

create type generated_document_status as enum ('draft', 'final', 'sent', 'archived');

create type complaint_status as enum (
  'not_started', 'draft_prepared', 'submitted', 'under_review',
  'response_received', 'closed'
);

create type message_direction as enum ('inbound', 'outbound');

create type chat_role as enum ('user', 'assistant', 'system');

create type expert_review_type as enum (
  'appeal_letter', 'evidence_packet', 'claim_strategy', 'complaint'
);

create type expert_review_status as enum (
  'requested', 'assigned', 'in_review', 'completed', 'needs_user_action'
);

create type referral_status as enum (
  'pending', 'consent_given', 'shared', 'contacted', 'closed'
);

create type notification_type as enum (
  'deadline_approaching', 'missing_documents', 'appeal_letter_ready',
  'ai_analysis_complete', 'complaint_draft_ready', 'expert_review_completed',
  'claim_status_updated', 'subscription_issue', 'payment_failed', 'weekly_summary'
);

create type support_ticket_status as enum (
  'open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'
);

create type subscription_plan as enum ('starter', 'plus', 'pro', 'premium');

create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'paused'
);

create type knowledge_category as enum (
  'state_regulation', 'company_playbook', 'insurance_type_guide', 'denial_reason',
  'evidence_checklist', 'letter_template', 'glossary', 'faq'
);

create type consent_type as enum (
  'terms_of_service', 'privacy_policy', 'legal_disclaimer',
  'sensitive_document_processing'
);

create type usage_event_type as enum (
  'ai_analysis', 'document_generated', 'document_uploaded', 'pdf_export',
  'complaint_generated', 'expert_review_requested'
);

-- ----------------------------------------------------------------------------
-- Helper functions
-- ----------------------------------------------------------------------------

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the current user is a platform admin. SECURITY DEFINER so RLS
-- policies can call it without recursing into admin_users' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- True when the current user owns the given claim. SECURITY DEFINER lets
-- child-table policies check ownership without exposing the claims table.
create or replace function public.owns_claim(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.claims where id = cid and user_id = auth.uid()
  );
$$;

-- Create a profile row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
