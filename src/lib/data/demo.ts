import type { Claim } from "@/lib/types";

/**
 * Demo data shown when Supabase is not connected yet, so the UI is fully
 * visible without keys. Replaced by real data once Supabase is configured.
 */

const now = Date.now();
const day = 86_400_000;
const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();
const date = (offsetDays: number) =>
  new Date(now + offsetDays * day).toISOString().slice(0, 10);

function baseClaim(): Omit<Claim, "id" | "claim_title"> {
  return {
    user_id: "demo-user",
    insurance_type: "auto",
    issue_type: "claim_denied",
    insurance_company: null,
    state: "TX",
    incident_state: null,
    policy_number: null,
    claim_number: null,
    adjuster_name: null,
    adjuster_email: null,
    adjuster_phone: null,
    amount_claimed: null,
    amount_offered: null,
    amount_paid: null,
    estimated_loss: null,
    deductible: null,
    incident_date: null,
    claim_filed_date: null,
    denial_date: null,
    last_response_date: null,
    appeal_deadline: null,
    user_summary: null,
    ai_summary: null,
    detected_denial_reason: null,
    current_status: "draft",
    priority_level: "medium",
    success_score: null,
    evidence_score: null,
    policy_score: null,
    timeline_score: null,
    consistency_score: null,
    negotiation_score: null,
    risk_score: null,
    ai_analysis: null,
    created_at: iso(-10),
    updated_at: iso(-1),
  };
}

export const DEMO_CLAIMS: Claim[] = [
  {
    ...baseClaim(),
    id: "demo-1",
    claim_title: "Denied auto collision claim",
    insurance_type: "auto",
    insurance_company: "Geico",
    state: "TX",
    amount_claimed: 8400,
    amount_offered: 0,
    estimated_loss: 8400,
    deductible: 500,
    detected_denial_reason: "damage_not_covered",
    current_status: "ai_analysis_completed",
    priority_level: "high",
    appeal_deadline: date(9),
    success_score: 68,
    evidence_score: 72,
    policy_score: 61,
    timeline_score: 80,
    created_at: iso(-12),
  },
  {
    ...baseClaim(),
    id: "demo-2",
    claim_title: "Health claim — out-of-network denial",
    insurance_type: "health",
    issue_type: "want_to_appeal",
    insurance_company: "UnitedHealthcare",
    state: "TX",
    amount_claimed: 3200,
    detected_denial_reason: "out_of_network",
    current_status: "documents_missing",
    priority_level: "urgent",
    appeal_deadline: date(3),
    success_score: 41,
    evidence_score: 35,
    policy_score: 52,
    created_at: iso(-6),
  },
  {
    ...baseClaim(),
    id: "demo-3",
    claim_title: "Homeowners water damage — low offer",
    insurance_type: "homeowners",
    issue_type: "payout_too_low",
    insurance_company: "State Farm",
    state: "TX",
    amount_claimed: 22000,
    amount_offered: 9500,
    current_status: "resolved",
    priority_level: "low",
    success_score: 84,
    created_at: iso(-40),
    updated_at: iso(-5),
  },
];

export interface RecentDocument {
  id: string;
  title: string;
  claim_id: string;
  created_at: string;
}

export const DEMO_RECENT_DOCUMENTS: RecentDocument[] = [
  {
    id: "demo-doc-1",
    title: "Appeal letter — Geico collision",
    claim_id: "demo-1",
    created_at: iso(-1),
  },
  {
    id: "demo-doc-2",
    title: "Request for claim file copy",
    claim_id: "demo-1",
    created_at: iso(-3),
  },
];
