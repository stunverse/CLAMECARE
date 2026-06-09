-- ============================================================================
-- ClaimCare AI — Persisted structured AI analysis (§12)
-- ============================================================================
-- Stores the full structured result of analyzeClaim() so the Analysis tab can
-- render strengths, weaknesses, strategy, flags, etc. without re-running the
-- model. Scores remain in their dedicated columns for indexing/filtering.
-- ============================================================================

alter table public.claims
  add column if not exists ai_analysis jsonb;
