-- ============================================================================
-- ClaimGuard — RLS & triggers for the case model
-- ============================================================================

-- Ownership helper (SECURITY DEFINER) for case-child tables.
create or replace function public.owns_case(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.cases where id = cid and user_id = auth.uid());
$$;

-- updated_at triggers (set_updated_at already exists)
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cases
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.case_documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.email_threads
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workflow_jobs
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.organizations         enable row level security;
alter table public.cases                 enable row level security;
alter table public.case_parties          enable row level security;
alter table public.case_documents        enable row level security;
alter table public.email_threads         enable row level security;
alter table public.email_messages        enable row level security;
alter table public.email_attachments     enable row level security;
alter table public.case_timeline         enable row level security;
alter table public.workflow_jobs         enable row level security;
alter table public.ai_classifications    enable row level security;
alter table public.payment_promises      enable row level security;
alter table public.payment_confirmations enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.automation_settings   enable row level security;
alter table public.ai_prompts            enable row level security;

-- organizations
create policy "organizations_select" on public.organizations for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "organizations_insert" on public.organizations for insert to authenticated
  with check (user_id = auth.uid());
create policy "organizations_update" on public.organizations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "organizations_delete" on public.organizations for delete to authenticated
  using (user_id = auth.uid());

-- cases (owner CRUD; staff may read & update for manual intervention)
create policy "cases_select" on public.cases for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "cases_insert" on public.cases for insert to authenticated
  with check (user_id = auth.uid());
create policy "cases_update" on public.cases for update to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());
create policy "cases_delete" on public.cases for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Generic case-child policy set (owner via owns_case OR staff)
create policy "case_parties_all" on public.case_parties for all to authenticated
  using (public.owns_case(case_id) or public.is_staff())
  with check (public.owns_case(case_id) or public.is_staff());

create policy "case_documents_select" on public.case_documents for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "case_documents_insert" on public.case_documents for insert to authenticated
  with check (user_id = auth.uid() and public.owns_case(case_id));
create policy "case_documents_update" on public.case_documents for update to authenticated
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "case_documents_delete" on public.case_documents for delete to authenticated
  using (user_id = auth.uid());

create policy "email_threads_all" on public.email_threads for all to authenticated
  using (public.owns_case(case_id) or public.is_staff())
  with check (public.owns_case(case_id) or public.is_staff());

create policy "email_messages_all" on public.email_messages for all to authenticated
  using (public.owns_case(case_id) or public.is_staff())
  with check (public.owns_case(case_id) or public.is_staff());

create policy "email_attachments_all" on public.email_attachments for all to authenticated
  using (
    exists (
      select 1 from public.email_messages m
      where m.id = message_id and (public.owns_case(m.case_id) or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.email_messages m
      where m.id = message_id and (public.owns_case(m.case_id) or public.is_staff())
    )
  );

create policy "case_timeline_select" on public.case_timeline for select to authenticated
  using (public.owns_case(case_id) or public.is_staff());
create policy "case_timeline_insert" on public.case_timeline for insert to authenticated
  with check (public.owns_case(case_id) or public.is_staff());

create policy "workflow_jobs_select" on public.workflow_jobs for select to authenticated
  using (public.owns_case(case_id) or public.is_staff());
create policy "workflow_jobs_write" on public.workflow_jobs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "ai_classifications_select" on public.ai_classifications for select to authenticated
  using (public.owns_case(case_id) or public.is_staff());

create policy "payment_promises_select" on public.payment_promises for select to authenticated
  using (public.owns_case(case_id) or public.is_staff());

create policy "payment_confirmations_select" on public.payment_confirmations for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "payment_confirmations_insert" on public.payment_confirmations for insert to authenticated
  with check (user_id = auth.uid() and public.owns_case(case_id));

-- audit_logs (own read + insert; staff read)
create policy "audit_logs_select" on public.audit_logs for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "audit_logs_insert" on public.audit_logs for insert to authenticated
  with check (user_id = auth.uid() or public.is_staff());

-- automation_settings & ai_prompts (staff read; admin write)
create policy "automation_settings_read" on public.automation_settings for select to authenticated
  using (public.is_staff());
create policy "automation_settings_write" on public.automation_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "ai_prompts_read" on public.ai_prompts for select to authenticated
  using (public.is_staff());
create policy "ai_prompts_write" on public.ai_prompts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed default automation settings
-- ----------------------------------------------------------------------------
insert into public.automation_settings (key, value) values
  ('reminders', '{"first_contact_day":0,"reminder_days":[3,7,14],"max_reminders":3,"send_hour_start":9,"send_hour_end":18,"send_days":[1,2,3,4,5]}'::jsonb),
  ('ai_thresholds', '{"auto_send_min_confidence":0.9,"review_min_confidence":0.6}'::jsonb)
on conflict (key) do nothing;
