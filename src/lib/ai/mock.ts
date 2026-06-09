import { INSURANCE_TYPE_LABELS, DENIAL_REASON_LABELS } from "@/lib/labels";
import { daysUntil } from "@/lib/format";
import type {
  AnalyzeClaimResult,
  ClaimAnalysisInput,
  EvidenceSuggestion,
} from "@/lib/ai/types";
import type { DenialReason, InsuranceType } from "@/lib/types/enums";

const EVIDENCE_TEMPLATES: Partial<
  Record<InsuranceType, EvidenceSuggestion[]>
> = {
  auto: [
    { title: "Police or accident report", importance: "critical", reason: "Establishes the facts and liability of the incident.", how_to_get_it: "Request a copy from the responding police department." },
    { title: "Photos of the damage", importance: "critical", reason: "Visual proof of the loss and its severity.", how_to_get_it: "Use clear, dated photos from multiple angles." },
    { title: "Repair estimate", importance: "important", reason: "Documents the cost of the claimed damage.", how_to_get_it: "Get a written estimate from a licensed repair shop." },
    { title: "Your auto policy", importance: "important", reason: "Confirms your coverage and any exclusions.", how_to_get_it: "Download it from your insurer's portal or request a copy." },
    { title: "Denial letter", importance: "critical", reason: "States the insurer's reason, which your appeal must address.", how_to_get_it: "Keep the letter or email you received from the insurer." },
  ],
  health: [
    { title: "Denial letter / EOB", importance: "critical", reason: "Shows the exact denial reason and codes to dispute.", how_to_get_it: "Find it in your insurer portal or the mailed letter." },
    { title: "Medical records", importance: "critical", reason: "Supports the medical necessity of the care.", how_to_get_it: "Request records from your treating provider." },
    { title: "Letter of medical necessity", importance: "important", reason: "A doctor's statement strengthens a necessity appeal.", how_to_get_it: "Ask your physician to write one referencing your diagnosis." },
    { title: "Plan benefits summary", importance: "important", reason: "Confirms what your plan covers.", how_to_get_it: "Download the Summary of Benefits and Coverage (SBC)." },
    { title: "Prior authorization records", importance: "helpful", reason: "Relevant if the denial cites authorization.", how_to_get_it: "Request the authorization history from your insurer." },
  ],
  homeowners: [
    { title: "Photos of the damage", importance: "critical", reason: "Documents the extent of the loss.", how_to_get_it: "Take dated photos before any repairs." },
    { title: "Repair / replacement estimate", importance: "important", reason: "Quantifies the claimed amount.", how_to_get_it: "Get a written estimate from a licensed contractor." },
    { title: "Proof of ownership / value", importance: "important", reason: "Supports the value of damaged property.", how_to_get_it: "Gather receipts, photos, or appraisals." },
    { title: "Your homeowners policy", importance: "important", reason: "Confirms covered perils and exclusions.", how_to_get_it: "Request the full policy and declarations page." },
    { title: "Denial letter", importance: "critical", reason: "Identifies the reason your appeal must rebut.", how_to_get_it: "Keep the insurer's written decision." },
  ],
};

const DEFAULT_EVIDENCE: EvidenceSuggestion[] = [
  { title: "Denial letter", importance: "critical", reason: "States the insurer's reason, which your appeal must address.", how_to_get_it: "Keep the written decision from your insurer." },
  { title: "Your insurance policy", importance: "important", reason: "Confirms your coverage, limits, and exclusions.", how_to_get_it: "Request the full policy and declarations page." },
  { title: "Proof of loss (photos, receipts, invoices)", importance: "important", reason: "Documents what happened and its value.", how_to_get_it: "Collect dated photos and itemized receipts." },
  { title: "Correspondence with your insurer", importance: "helpful", reason: "Shows the timeline and any unanswered requests.", how_to_get_it: "Save emails, letters, and call notes." },
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Deterministic, sensible analysis used without an AI key (demo) and as a
 *  safe fallback. Built only from the claim's own data. */
export function mockAnalyzeClaim(input: ClaimAnalysisInput): AnalyzeClaimResult {
  const { claim, documents } = input;
  const typeLabel = claim.insurance_type
    ? INSURANCE_TYPE_LABELS[claim.insurance_type].toLowerCase()
    : "insurance";

  const denial_reason: DenialReason | null =
    claim.detected_denial_reason ??
    (claim.issue_type === "payout_too_low" ? null : "missing_documentation");

  const hasDocs = documents.length > 0;
  const days = daysUntil(claim.appeal_deadline);

  const evidence_checklist =
    (claim.insurance_type && EVIDENCE_TEMPLATES[claim.insurance_type]) ||
    DEFAULT_EVIDENCE;

  const missing_documents = evidence_checklist
    .filter((e) => e.importance === "critical")
    .map((e) => e.title);

  const evidenceScore = claim.evidence_score ?? (hasDocs ? 62 : 38);
  const policyScore = claim.policy_score ?? 55;
  const timelineScore =
    claim.timeline_score ??
    (days === null ? 60 : days >= 0 ? 75 : 30);
  const consistencyScore = claim.consistency_score ?? 70;
  const negotiationScore =
    claim.negotiation_score ??
    (claim.amount_offered && claim.amount_claimed ? 58 : 50);
  const riskScore =
    claim.risk_score ?? (days !== null && days < 0 ? 70 : 35);
  const successScore =
    claim.success_score ??
    clamp(
      (evidenceScore + policyScore + timelineScore + consistencyScore) / 4 -
        riskScore / 5,
    );

  const urgency =
    days !== null && days <= 7
      ? "urgent"
      : days !== null && days <= 14
        ? "high"
        : claim.priority_level;

  const strengths: string[] = [];
  if (hasDocs) strengths.push("You have already uploaded supporting documents.");
  if (claim.user_summary)
    strengths.push("You provided a clear description of what happened.");
  if (days !== null && days >= 0)
    strengths.push("Your appeal deadline has not passed yet.");
  if (strengths.length === 0)
    strengths.push("Your claim can be strengthened by adding key documents.");

  const weaknesses: string[] = [];
  if (!hasDocs)
    weaknesses.push("No documents have been uploaded to support the claim yet.");
  if (missing_documents.length)
    weaknesses.push(
      `Critical evidence may be missing: ${missing_documents.join(", ")}.`,
    );
  if (days !== null && days < 0)
    weaknesses.push("The appeal deadline appears to have passed — verify this carefully.");

  return {
    denial_reason,
    denial_reason_explained_simple: denial_reason
      ? `The insurer appears to have based its decision on "${DENIAL_REASON_LABELS[denial_reason]}". This means you should focus your response on directly addressing that specific reason with evidence.`
      : `Your ${typeLabel} claim concerns the amount offered rather than an outright denial. The focus should be on documenting the true value of your loss.`,
    strengths,
    weaknesses,
    missing_documents,
    key_dates: [
      { label: "Denial date", value: claim.denial_date ?? "unknown" },
      { label: "Appeal deadline", value: claim.appeal_deadline ?? "unknown" },
    ],
    key_amounts: [
      { label: "Amount claimed", value: String(claim.amount_claimed ?? "unknown") },
      { label: "Amount offered", value: String(claim.amount_offered ?? "unknown") },
    ],
    policy_issues: [
      "Review your policy for the exact coverage and any exclusions cited.",
    ],
    possible_counterarguments: [
      "Point to specific policy language that supports coverage.",
      "Provide additional documentation that addresses the stated reason.",
    ],
    recommended_strategy: [
      "Gather the critical evidence listed in your checklist.",
      "Carefully re-read the denial letter and the relevant policy sections.",
      "Draft an appeal letter that directly addresses the denial reason.",
      "Submit your appeal before the deadline and keep proof of delivery.",
    ],
    recommended_next_action: hasDocs
      ? "Review your evidence checklist and prepare your appeal letter."
      : "Upload your denial letter and policy so the analysis can be more specific.",
    urgency_level: urgency,
    risk_flags:
      days !== null && days < 0
        ? ["Possible missed appeal deadline — verify with your insurer."]
        : [],
    should_appeal: claim.issue_type !== "payout_too_low",
    should_request_more_info: !hasDocs,
    should_file_complaint: false,
    should_consult_attorney:
      (claim.amount_claimed ?? 0) >= 50000 || riskScore >= 70,
    confidence_level: hasDocs ? 60 : 40,
    scores: {
      success: clamp(successScore),
      evidence: clamp(evidenceScore),
      policy: clamp(policyScore),
      timeline: clamp(timelineScore),
      consistency: clamp(consistencyScore),
      negotiation: clamp(negotiationScore),
      risk: clamp(riskScore),
    },
    evidence_checklist,
  };
}
