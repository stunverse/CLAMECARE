-- ============================================================================
-- ClaimGuard — Case model (pivot: automated payment-collection for trainers)
-- ============================================================================
-- Additive migration: introduces the case-centric domain alongside the legacy
-- insurance tables (no destructive changes). Priority 1: data model + statuses.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Staff roles (admin + agent) — reuse admin_users, add a role
-- ----------------------------------------------------------------------------
create type admin_role as enum ('admin', 'agent');

alter table public.admin_users
  add column if not exists role admin_role not null default 'admin';

-- is_admin(): platform admins only. Redefine to require role = 'admin'.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid() and role = 'admin'
  );
$$;

-- is_staff(): admins OR agents (internal ClaimGuard team).
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- Profile extension (trainer / professional info + mandate)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists business_name text,
  add column if not exists siret text,
  add column if not exists address text,
  add column if not exists professional_status text,
  add column if not exists payee_name text,
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists mandate_accepted_at timestamptz;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type case_status as enum (
  'draft', 'under_analysis', 'missing_information', 'ready_to_contact',
  'first_contact_sent', 'waiting_for_organization', 'document_requested',
  'client_action_required', 'in_discussion', 'payment_promised', 'payment_due',
  'payment_overdue', 'disputed', 'human_review_required', 'paid', 'closed',
  'cancelled'
);

create type case_risk_level as enum ('low', 'medium', 'high');

-- Automation risk of an outbound action (§14).
create type automation_level as enum ('auto', 'review', 'forbidden');

create type case_party_role as enum ('debtor', 'client', 'contact');

create type case_document_category as enum (
  'invoice', 'convention', 'subcontract', 'purchase_order', 'attendance_sheet',
  'completion_certificate', 'program', 'email', 'screenshot', 'other'
);

create type email_direction as enum ('inbound', 'outbound');

create type email_category as enum (
  'payment_confirmed', 'payment_date_given', 'document_missing',
  'invoice_not_received', 'invoice_rejected', 'wrong_invoice',
  'purchase_order_missing', 'waiting_internal_approval', 'accounting_processing',
  'dispute', 'request_information', 'out_of_office', 'unknown'
);

create type email_message_status as enum (
  'queued', 'sending', 'sent', 'delivered', 'failed', 'received'
);

create type workflow_job_status as enum (
  'pending', 'running', 'completed', 'failed', 'cancelled'
);

create type case_event_source as enum (
  'automation', 'ai', 'admin', 'agent', 'client', 'system'
);

create type payment_type as enum ('full', 'partial');

create type case_analysis_status as enum (
  'uploaded', 'processing', 'analyzed', 'failed'
);

-- ----------------------------------------------------------------------------
-- Sequence for human-readable case references (CG-YYYY-000123)
-- ----------------------------------------------------------------------------
create sequence if not exists public.case_ref_seq;

create or replace function public.next_case_reference()
returns text language sql volatile as $$
  select 'CG-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.case_ref_seq')::text, 6, '0');
$$;

-- ----------------------------------------------------------------------------
-- organizations (debtor training organizations) — owned by the creator
-- ----------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  legal_name text,
  siret text,
  address text,
  general_email text,
  accounting_email text,
  phone text,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organizations_user_id_idx on public.organizations (user_id);

-- ----------------------------------------------------------------------------
-- cases — the core dossier
-- ----------------------------------------------------------------------------
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_reference text not null unique default public.next_case_reference(),
  organization_id uuid references public.organizations (id) on delete set null,

  -- Denormalized debtor snapshot (partial entry allowed)
  debtor_name text,
  debtor_email text,
  debtor_accounting_email text,
  debtor_contact_name text,
  debtor_contact_email text,

  -- Invoice
  invoice_number text,
  invoice_date date,
  due_date date,
  amount_ht numeric(14, 2),
  vat_amount numeric(14, 2),
  original_amount numeric(14, 2),      -- TTC due
  remaining_amount numeric(14, 2),
  currency text not null default 'EUR',
  service_description text,

  -- Client payment coordinates (the CLIENT's own account — never ClaimGuard's)
  payee_name text,
  iban text,
  bic text,

  -- State
  status case_status not null default 'draft',
  risk_level case_risk_level not null default 'low',
  completeness_score smallint check (completeness_score between 0 and 100),
  promised_payment_date date,
  last_contact_at timestamptz,
  next_action_at timestamptz,
  automation_enabled boolean not null default true,
  human_review_required boolean not null default false,
  reminder_count integer not null default 0,

  -- AI
  ai_summary text,
  ai_analysis jsonb,

  client_history text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_user_id_idx on public.cases (user_id);
create index cases_status_idx on public.cases (status);
create index cases_next_action_idx on public.cases (next_action_at);
create index cases_org_idx on public.cases (organization_id);

-- ----------------------------------------------------------------------------
-- case_parties (extra contacts on a case)
-- ----------------------------------------------------------------------------
create table public.case_parties (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  role case_party_role not null,
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create index case_parties_case_idx on public.case_parties (case_id);

-- ----------------------------------------------------------------------------
-- case_documents (secure vault per case)
-- ----------------------------------------------------------------------------
create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  file_name text not null,
  file_url text,
  file_type text,
  mime_type text,
  file_size bigint,
  document_category case_document_category not null default 'other',
  extracted_text text,
  ai_summary text,
  extracted_fields jsonb not null default '{}'::jsonb,
  analysis_status case_analysis_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index case_documents_case_idx on public.case_documents (case_id);
create index case_documents_user_idx on public.case_documents (user_id);

-- ----------------------------------------------------------------------------
-- email_threads / email_messages / email_attachments
-- ----------------------------------------------------------------------------
create table public.email_threads (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_threads_case_idx on public.email_threads (case_id);

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  thread_id uuid references public.email_threads (id) on delete set null,
  direction email_direction not null,
  from_email text,
  to_email text,
  subject text,
  body text,
  category email_category,
  confidence numeric(4, 3),
  status email_message_status not null default 'queued',
  external_id text,
  ai_generated boolean not null default false,
  requires_review boolean not null default false,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_messages_case_idx on public.email_messages (case_id, created_at);
create index email_messages_thread_idx on public.email_messages (thread_id);

create table public.email_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.email_messages (id) on delete cascade,
  document_id uuid references public.case_documents (id) on delete set null,
  file_name text,
  created_at timestamptz not null default now()
);
create index email_attachments_message_idx on public.email_attachments (message_id);

-- ----------------------------------------------------------------------------
-- case_timeline (client-facing, human-readable history)
-- ----------------------------------------------------------------------------
create table public.case_timeline (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  old_status case_status,
  new_status case_status,
  source case_event_source not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index case_timeline_case_idx on public.case_timeline (case_id, created_at);

-- ----------------------------------------------------------------------------
-- workflow_jobs (asynchronous automation, idempotent)
-- ----------------------------------------------------------------------------
create table public.workflow_jobs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  job_type text not null,
  status workflow_job_status not null default 'pending',
  run_at timestamptz not null default now(),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  idempotency_key text unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workflow_jobs_due_idx on public.workflow_jobs (status, run_at);
create index workflow_jobs_case_idx on public.workflow_jobs (case_id);

-- ----------------------------------------------------------------------------
-- ai_classifications (audit of AI decisions with confidence)
-- ----------------------------------------------------------------------------
create table public.ai_classifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  email_message_id uuid references public.email_messages (id) on delete set null,
  kind text not null,
  result jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3),
  model text,
  prompt_version text,
  created_at timestamptz not null default now()
);
create index ai_classifications_case_idx on public.ai_classifications (case_id);

-- ----------------------------------------------------------------------------
-- payment_promises / payment_confirmations
-- ----------------------------------------------------------------------------
create table public.payment_promises (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  promised_date date not null,
  amount numeric(14, 2),
  source_email_id uuid references public.email_messages (id) on delete set null,
  created_at timestamptz not null default now()
);
create index payment_promises_case_idx on public.payment_promises (case_id);

create table public.payment_confirmations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2),
  paid_at date,
  payment_type payment_type not null default 'full',
  remaining_after numeric(14, 2),
  created_at timestamptz not null default now()
);
create index payment_confirmations_case_idx on public.payment_confirmations (case_id);

-- ----------------------------------------------------------------------------
-- audit_logs (technical audit trail, §29)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  case_id uuid references public.cases (id) on delete cascade,
  action text not null,
  source case_event_source not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index audit_logs_case_idx on public.audit_logs (case_id, created_at);
create index audit_logs_user_idx on public.audit_logs (user_id, created_at);

-- ----------------------------------------------------------------------------
-- automation_settings (configurable rules, single-row key/value)
-- ----------------------------------------------------------------------------
create table public.automation_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ai_prompts (versioned prompts, §54)
-- ----------------------------------------------------------------------------
create table public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version integer not null default 1,
  type text,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (key, version)
);
