-- ============================================================================
-- ClaimCare AI — Row Level Security & triggers
-- ============================================================================
-- Strict per-user isolation; admins (admin_users) get read access to user data
-- for support, and full control of reference/knowledge tables.
-- Service-role clients bypass RLS for trusted server tasks (Stripe webhooks…).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.claims
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.claim_documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.evidence_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.timeline_events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.generated_documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.complaints
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.messages
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.expert_reviews
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attorney_referrals
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.claim_library_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.usage_limits
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.knowledge_base_entries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.state_regulations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.insurance_companies
  for each row execute function public.set_updated_at();

-- Auto-provision a profile when a new auth user is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Enable RLS on every table
-- ----------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.claims                 enable row level security;
alter table public.claim_documents        enable row level security;
alter table public.evidence_items         enable row level security;
alter table public.timeline_events        enable row level security;
alter table public.generated_documents    enable row level security;
alter table public.complaints             enable row level security;
alter table public.messages               enable row level security;
alter table public.ai_chat_messages       enable row level security;
alter table public.expert_reviews         enable row level security;
alter table public.attorney_referrals     enable row level security;
alter table public.claim_library_items    enable row level security;
alter table public.notifications          enable row level security;
alter table public.support_tickets        enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.usage_limits           enable row level security;
alter table public.usage_events           enable row level security;
alter table public.activity_logs          enable row level security;
alter table public.user_consents          enable row level security;
alter table public.knowledge_base_entries enable row level security;
alter table public.knowledge_base_chunks  enable row level security;
alter table public.state_regulations      enable row level security;
alter table public.insurance_companies    enable row level security;
alter table public.admin_users            enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- claims  (owner full CRUD; admin read-only)
-- ----------------------------------------------------------------------------
create policy "claims_select" on public.claims for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "claims_insert" on public.claims for insert to authenticated
  with check (user_id = auth.uid());
create policy "claims_update" on public.claims for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "claims_delete" on public.claims for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- claim_documents
-- ----------------------------------------------------------------------------
create policy "claim_documents_select" on public.claim_documents for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "claim_documents_insert" on public.claim_documents for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "claim_documents_update" on public.claim_documents for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "claim_documents_delete" on public.claim_documents for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- evidence_items  (ownership via parent claim)
-- ----------------------------------------------------------------------------
create policy "evidence_items_select" on public.evidence_items for select to authenticated
  using (public.owns_claim(claim_id) or public.is_admin());
create policy "evidence_items_insert" on public.evidence_items for insert to authenticated
  with check (public.owns_claim(claim_id));
create policy "evidence_items_update" on public.evidence_items for update to authenticated
  using (public.owns_claim(claim_id)) with check (public.owns_claim(claim_id));
create policy "evidence_items_delete" on public.evidence_items for delete to authenticated
  using (public.owns_claim(claim_id));

-- ----------------------------------------------------------------------------
-- timeline_events  (ownership via parent claim)
-- ----------------------------------------------------------------------------
create policy "timeline_events_select" on public.timeline_events for select to authenticated
  using (public.owns_claim(claim_id) or public.is_admin());
create policy "timeline_events_insert" on public.timeline_events for insert to authenticated
  with check (public.owns_claim(claim_id));
create policy "timeline_events_update" on public.timeline_events for update to authenticated
  using (public.owns_claim(claim_id)) with check (public.owns_claim(claim_id));
create policy "timeline_events_delete" on public.timeline_events for delete to authenticated
  using (public.owns_claim(claim_id));

-- ----------------------------------------------------------------------------
-- generated_documents
-- ----------------------------------------------------------------------------
create policy "generated_documents_select" on public.generated_documents for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "generated_documents_insert" on public.generated_documents for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "generated_documents_update" on public.generated_documents for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "generated_documents_delete" on public.generated_documents for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- complaints
-- ----------------------------------------------------------------------------
create policy "complaints_select" on public.complaints for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "complaints_insert" on public.complaints for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "complaints_update" on public.complaints for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "complaints_delete" on public.complaints for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------
create policy "messages_select" on public.messages for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "messages_insert" on public.messages for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "messages_update" on public.messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages_delete" on public.messages for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ai_chat_messages
-- ----------------------------------------------------------------------------
create policy "ai_chat_messages_select" on public.ai_chat_messages for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "ai_chat_messages_insert" on public.ai_chat_messages for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "ai_chat_messages_delete" on public.ai_chat_messages for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- expert_reviews  (owner + assigned expert + admin)
-- ----------------------------------------------------------------------------
create policy "expert_reviews_select" on public.expert_reviews for select to authenticated
  using (user_id = auth.uid() or expert_id = auth.uid() or public.is_admin());
create policy "expert_reviews_insert" on public.expert_reviews for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "expert_reviews_update" on public.expert_reviews for update to authenticated
  using (user_id = auth.uid() or expert_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or expert_id = auth.uid() or public.is_admin());
create policy "expert_reviews_delete" on public.expert_reviews for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- attorney_referrals
-- ----------------------------------------------------------------------------
create policy "attorney_referrals_select" on public.attorney_referrals for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "attorney_referrals_insert" on public.attorney_referrals for insert to authenticated
  with check (user_id = auth.uid() and public.owns_claim(claim_id));
create policy "attorney_referrals_update" on public.attorney_referrals for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "attorney_referrals_delete" on public.attorney_referrals for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "notifications_insert" on public.notifications for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- support_tickets  (owner + admin manage)
-- ----------------------------------------------------------------------------
create policy "support_tickets_select" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "support_tickets_insert" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid());
create policy "support_tickets_update" on public.support_tickets for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "support_tickets_delete" on public.support_tickets for delete to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- subscriptions / usage_limits  (read-only for users; written via service role)
-- ----------------------------------------------------------------------------
create policy "subscriptions_select" on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "usage_limits_select" on public.usage_limits for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- usage_events  (own read + insert; immutable)
-- ----------------------------------------------------------------------------
create policy "usage_events_select" on public.usage_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "usage_events_insert" on public.usage_events for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- activity_logs  (own read + insert; immutable audit trail)
-- ----------------------------------------------------------------------------
create policy "activity_logs_select" on public.activity_logs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "activity_logs_insert" on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- user_consents  (own read + insert; immutable ledger)
-- ----------------------------------------------------------------------------
create policy "user_consents_select" on public.user_consents for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "user_consents_insert" on public.user_consents for insert to authenticated
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Reference / knowledge tables  (read: any authenticated user; write: admin)
-- ----------------------------------------------------------------------------
create policy "claim_library_items_read" on public.claim_library_items for select to authenticated
  using (true);
create policy "claim_library_items_write" on public.claim_library_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "knowledge_base_entries_read" on public.knowledge_base_entries for select to authenticated
  using (true);
create policy "knowledge_base_entries_write" on public.knowledge_base_entries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "knowledge_base_chunks_read" on public.knowledge_base_chunks for select to authenticated
  using (true);
create policy "knowledge_base_chunks_write" on public.knowledge_base_chunks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "state_regulations_read" on public.state_regulations for select to authenticated
  using (true);
create policy "state_regulations_write" on public.state_regulations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "insurance_companies_read" on public.insurance_companies for select to authenticated
  using (true);
create policy "insurance_companies_write" on public.insurance_companies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- admin_users  (visible to admins only; managed via service role)
-- ----------------------------------------------------------------------------
create policy "admin_users_select" on public.admin_users for select to authenticated
  using (public.is_admin());
