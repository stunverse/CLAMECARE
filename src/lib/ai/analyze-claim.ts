import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { mockAnalyzeClaim } from "@/lib/ai/mock";
import {
  DENIAL_REASONS,
  EVIDENCE_IMPORTANCE,
  PRIORITY_LEVELS,
} from "@/lib/types/enums";
import type {
  AnalyzeClaimResult,
  ClaimAnalysisInput,
  EvidenceSuggestion,
  LabeledValue,
} from "@/lib/ai/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const strArray = (v: any): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

const clamp = (v: any, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
};

const labeled = (v: any): LabeledValue[] =>
  Array.isArray(v)
    ? v
        .filter((x) => x && typeof x.label === "string")
        .map((x) => ({ label: String(x.label), value: String(x.value ?? "") }))
    : [];

const bool = (v: any, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback;

function normalizeEvidence(v: any): EvidenceSuggestion[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x.title === "string")
    .map((x) => ({
      title: String(x.title),
      importance: EVIDENCE_IMPORTANCE.includes(x.importance)
        ? x.importance
        : "helpful",
      reason: String(x.reason ?? ""),
      how_to_get_it: String(x.how_to_get_it ?? ""),
    }));
}

/**
 * Merge the model's raw JSON onto the deterministic mock result so the output
 * is always complete and well-typed, even if the model omits or malforms keys.
 */
function normalize(
  raw: any,
  input: ClaimAnalysisInput,
): AnalyzeClaimResult {
  const base = mockAnalyzeClaim(input);
  if (!raw || typeof raw !== "object") return base;

  const scores = raw.scores ?? {};

  return {
    denial_reason: DENIAL_REASONS.includes(raw.denial_reason)
      ? raw.denial_reason
      : base.denial_reason,
    denial_reason_explained_simple:
      typeof raw.denial_reason_explained_simple === "string"
        ? raw.denial_reason_explained_simple
        : base.denial_reason_explained_simple,
    strengths: strArray(raw.strengths).length ? strArray(raw.strengths) : base.strengths,
    weaknesses: strArray(raw.weaknesses).length ? strArray(raw.weaknesses) : base.weaknesses,
    missing_documents: strArray(raw.missing_documents),
    key_dates: labeled(raw.key_dates).length ? labeled(raw.key_dates) : base.key_dates,
    key_amounts: labeled(raw.key_amounts).length ? labeled(raw.key_amounts) : base.key_amounts,
    policy_issues: strArray(raw.policy_issues),
    possible_counterarguments: strArray(raw.possible_counterarguments),
    recommended_strategy: strArray(raw.recommended_strategy).length
      ? strArray(raw.recommended_strategy)
      : base.recommended_strategy,
    recommended_next_action:
      typeof raw.recommended_next_action === "string"
        ? raw.recommended_next_action
        : base.recommended_next_action,
    urgency_level: PRIORITY_LEVELS.includes(raw.urgency_level)
      ? raw.urgency_level
      : base.urgency_level,
    risk_flags: strArray(raw.risk_flags),
    should_appeal: bool(raw.should_appeal, base.should_appeal),
    should_request_more_info: bool(
      raw.should_request_more_info,
      base.should_request_more_info,
    ),
    should_file_complaint: bool(raw.should_file_complaint, base.should_file_complaint),
    should_consult_attorney: bool(
      raw.should_consult_attorney,
      base.should_consult_attorney,
    ),
    confidence_level: clamp(raw.confidence_level, base.confidence_level),
    scores: {
      success: clamp(scores.success, base.scores.success),
      evidence: clamp(scores.evidence, base.scores.evidence),
      policy: clamp(scores.policy, base.scores.policy),
      timeline: clamp(scores.timeline, base.scores.timeline),
      consistency: clamp(scores.consistency, base.scores.consistency),
      negotiation: clamp(scores.negotiation, base.scores.negotiation),
      risk: clamp(scores.risk, base.scores.risk),
    },
    evidence_checklist: normalizeEvidence(raw.evidence_checklist).length
      ? normalizeEvidence(raw.evidence_checklist)
      : base.evidence_checklist,
  };
}

/**
 * Analyze a claim and return a structured result.
 * Uses the configured AI provider when available; otherwise (or on any error)
 * falls back to a deterministic mock so the feature always works.
 */
export async function analyzeClaim(
  input: ClaimAnalysisInput,
): Promise<AnalyzeClaimResult> {
  if (!isOpenAIConfigured) return mockAnalyzeClaim(input);

  try {
    const raw = await generateJSON({
      system: buildSystemPrompt(),
      user: buildUserPrompt(input),
    });
    return normalize(JSON.parse(raw), input);
  } catch {
    return mockAnalyzeClaim(input);
  }
}

/** Short summary text for the claim's ai_summary column. */
export function composeAiSummary(result: AnalyzeClaimResult): string {
  return `${result.denial_reason_explained_simple} Recommended next step: ${result.recommended_next_action}`;
}
