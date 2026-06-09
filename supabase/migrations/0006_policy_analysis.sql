-- ============================================================================
-- ClaimCare AI — Persisted policy review (§13)
-- ============================================================================
alter table public.claims
  add column if not exists policy_analysis jsonb;
