-- ============================================================================
-- ClaimCare AI — Persisted negotiation analysis (§22)
-- ============================================================================
alter table public.claims
  add column if not exists negotiation_analysis jsonb;
