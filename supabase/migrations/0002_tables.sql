-- ============================================================================
-- ClaimCare AI — Tables & indexes
-- ============================================================================
-- Depends on enums/functions from 0001_init.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  role user_role not null default 'user',
  state text,
  country text not null default 'USA',
  preferred_language text not null default 'English',
  legal_disclaimer_accepted_at timestamptz,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- claims
-- ----------------------------------------------------------------------------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_title text not null default 'Untitled claim',
  insurance_type insurance_type,
  issue_type issue_type,
  insurance_company text,
  state text,
  incident_state text,
  policy_number text,
  claim_number text,
  adjuster_name text,
  adjuster_email text,
  adjuster_phone text,
  amount_claimed numeric(14, 2),
  amount_offered numeric(14, 2),
  amount_paid numeric(14, 2),
  estimated_loss numeric(14, 2),
  deductible numeric(14, 2),
  incident_date date,
  claim_filed_date date,
  denial_date date,
  last_response_date date,
  appeal_deadline date,
  user_summary text,
  ai_summary text,
  detected_denial_reason denial_reason,
  current_status claim_status not null default 'draft',
  priority_level priority_level not null default 'medium',
  -- Scores (0-100, nullable until computed)
  success_score smallint check (success_score between 0 and 100),
  evidence_score smallint check (evidence_score between 0 and 100),
  policy_score smallint check (policy_score between 0 and 100),
  timeline_score smallint check (timeline_score between 0 and 100),
  consistency_score smallint check (consistency_score between 0 and 100),
  negotiation_score smallint check (negotiation_score between 0 and 100),
  risk_score smallint check (risk_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index claims_user_id_idx on public.claims (user_id);
create index claims_status_idx on public.claims (current_status);
create index claims_insurance_type_idx on public.claims (insurance_type);
create index claims_appeal_deadline_idx on public.claims (appeal_deadline);
create index claims_created_at_idx on public.claims (created_at desc);

-- ----------------------------------------------------------------------------
-- claim_documents  (secure file vault, §11)
-- ----------------------------------------------------------------------------
create table public.claim_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  file_name text not null,
  file_url text,
  file_type text,
  mime_type text,
  file_size bigint,
  document_category document_category not null default 'other',
  extracted_text text,
  ai_summary text,
  extracted_dates jsonb not null default '[]'::jsonb,
  extracted_amounts jsonb not null default '[]'::jsonb,
  extracted_entities jsonb not null default '[]'::jsonb,
  analysis_status analysis_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index claim_documents_claim_id_idx on public.claim_documents (claim_id);
create index claim_documents_user_id_idx on public.claim_documents (user_id);

-- ----------------------------------------------------------------------------
-- evidence_items  (evidence builder, §14)
-- ----------------------------------------------------------------------------
create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  title text not null,
  description text,
  category text,
  importance evidence_importance not null default 'helpful',
  status evidence_status not null default 'missing',
  linked_document_id uuid references public.claim_documents (id) on delete set null,
  ai_reason text,
  how_to_get_it text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index evidence_items_claim_id_idx on public.evidence_items (claim_id);

-- ----------------------------------------------------------------------------
-- timeline_events  (timeline builder, §16)
-- ----------------------------------------------------------------------------
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  title text not null,
  description text,
  event_date date,
  event_type timeline_event_type,
  source_document_id uuid references public.claim_documents (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index timeline_events_claim_id_idx on public.timeline_events (claim_id);
create index timeline_events_event_date_idx on public.timeline_events (event_date);

-- ----------------------------------------------------------------------------
-- generated_documents  (letters + packets, §17/§18)
-- ----------------------------------------------------------------------------
create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  document_type generated_document_type not null,
  title text not null,
  content text,
  tone document_tone not null default 'professional',
  status generated_document_status not null default 'draft',
  pdf_url text,
  docx_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index generated_documents_claim_id_idx on public.generated_documents (claim_id);
create index generated_documents_user_id_idx on public.generated_documents (user_id);

-- ----------------------------------------------------------------------------
-- complaints  (regulator complaint assistant, §21)
-- ----------------------------------------------------------------------------
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  state text,
  regulator_name text,
  complaint_text text,
  status complaint_status not null default 'not_started',
  submitted_at timestamptz,
  response_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index complaints_claim_id_idx on public.complaints (claim_id);
create index complaints_user_id_idx on public.complaints (user_id);

-- ----------------------------------------------------------------------------
-- messages  (email/message assistant, §24)
-- ----------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  direction message_direction not null,
  sender text,
  recipient text,
  subject text,
  body text,
  ai_summary text,
  detected_deadlines jsonb not null default '[]'::jsonb,
  detected_requests jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_claim_id_idx on public.messages (claim_id);

-- ----------------------------------------------------------------------------
-- ai_chat_messages  (AI claim coach, §25)
-- ----------------------------------------------------------------------------
create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index ai_chat_messages_claim_id_idx on public.ai_chat_messages (claim_id, created_at);

-- ----------------------------------------------------------------------------
-- expert_reviews  (human expert review, §26 — premium/future)
-- ----------------------------------------------------------------------------
create table public.expert_reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  expert_id uuid references auth.users (id) on delete set null,
  review_type expert_review_type not null,
  status expert_review_status not null default 'requested',
  user_note text,
  expert_summary text,
  expert_recommendations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index expert_reviews_claim_id_idx on public.expert_reviews (claim_id);
create index expert_reviews_expert_id_idx on public.expert_reviews (expert_id);

-- ----------------------------------------------------------------------------
-- attorney_referrals  (attorney referral, §27 — future)
-- ----------------------------------------------------------------------------
create table public.attorney_referrals (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  attorney_name text,
  attorney_email text,
  state text,
  practice_area text,
  referral_status referral_status not null default 'pending',
  user_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attorney_referrals_claim_id_idx on public.attorney_referrals (claim_id);

-- ----------------------------------------------------------------------------
-- claim_library_items  (resource library, §28 — reference data)
-- ----------------------------------------------------------------------------
create table public.claim_library_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category knowledge_category,
  insurance_type insurance_type,
  state text,
  company text,
  content text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index claim_library_items_category_idx on public.claim_library_items (category);

-- ----------------------------------------------------------------------------
-- notifications  (§29)
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  claim_id uuid references public.claims (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text,
  is_read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications (user_id, is_read);

-- ----------------------------------------------------------------------------
-- support_tickets  (§32)
-- ----------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  message text,
  status support_ticket_status not null default 'open',
  priority priority_level not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_id_idx on public.support_tickets (user_id);
create index support_tickets_status_idx on public.support_tickets (status);

-- ----------------------------------------------------------------------------
-- subscriptions  (Stripe billing, §30)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name subscription_plan,
  status subscription_status,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscriptions_user_id_key on public.subscriptions (user_id);
create index subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);

-- ----------------------------------------------------------------------------
-- usage_limits  (per-plan quotas, §30)
-- ----------------------------------------------------------------------------
create table public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_name subscription_plan not null default 'starter',
  active_claims_limit integer,
  documents_limit integer,
  ai_analysis_limit integer,
  generated_documents_limit integer,
  storage_limit_mb integer,
  expert_reviews_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index usage_limits_user_id_key on public.usage_limits (user_id);

-- ----------------------------------------------------------------------------
-- usage_events  (metering, §30/§47)
-- ----------------------------------------------------------------------------
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type usage_event_type not null,
  claim_id uuid references public.claims (id) on delete set null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);
create index usage_events_user_id_idx on public.usage_events (user_id, created_at);

-- ----------------------------------------------------------------------------
-- activity_logs  (audit trail, §33)
-- ----------------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  claim_id uuid references public.claims (id) on delete cascade,
  action_type text not null,
  action_description text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index activity_logs_claim_id_idx on public.activity_logs (claim_id, created_at);
create index activity_logs_user_id_idx on public.activity_logs (user_id, created_at);

-- ----------------------------------------------------------------------------
-- user_consents  (legal consent ledger, §34)
-- ----------------------------------------------------------------------------
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type consent_type not null,
  consent_text text,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  created_at timestamptz not null default now()
);
create index user_consents_user_id_idx on public.user_consents (user_id);

-- ----------------------------------------------------------------------------
-- knowledge_base_entries  (RAG source documents, §35)
-- ----------------------------------------------------------------------------
create table public.knowledge_base_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category knowledge_category,
  content text,
  source_url text,
  state text,
  insurance_type insurance_type,
  company text,
  tags text[] not null default '{}',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_base_entries_category_idx on public.knowledge_base_entries (category);
create index knowledge_base_entries_state_idx on public.knowledge_base_entries (state);

-- ----------------------------------------------------------------------------
-- knowledge_base_chunks  (RAG chunks + embeddings, §35)
-- ----------------------------------------------------------------------------
create table public.knowledge_base_chunks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.knowledge_base_entries (id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension; nullable until embedded
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index knowledge_base_chunks_entry_id_idx on public.knowledge_base_chunks (entry_id);

-- ----------------------------------------------------------------------------
-- state_regulations  (state DOI knowledge base, §19 — reference data)
-- ----------------------------------------------------------------------------
create table public.state_regulations (
  id uuid primary key default gen_random_uuid(),
  state_code text not null,
  state_name text not null,
  department_name text,
  complaint_url text,
  phone text,
  email text,
  mailing_address text,
  general_rules text,
  claim_handling_deadlines text,
  complaint_instructions text,
  last_verified_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index state_regulations_state_code_key on public.state_regulations (state_code);

-- ----------------------------------------------------------------------------
-- insurance_companies  (company playbook, §20 — reference data)
-- ----------------------------------------------------------------------------
create table public.insurance_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  claims_url text,
  appeals_url text,
  customer_service_phone text,
  mailing_address text,
  supported_insurance_types insurance_type[] not null default '{}',
  common_denial_reasons text[] not null default '{}',
  recommended_documents text[] not null default '{}',
  escalation_steps text,
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index insurance_companies_name_key on public.insurance_companies (lower(name));

-- ----------------------------------------------------------------------------
-- admin_users  (platform admins — source of truth for is_admin())
-- ----------------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
