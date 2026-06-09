import type { Claim } from "@/lib/types";
import type {
  DenialReason,
  EvidenceImportance,
  PriorityLevel,
} from "@/lib/types/enums";

export interface AnalysisScores {
  success: number;
  evidence: number;
  policy: number;
  timeline: number;
  consistency: number;
  negotiation: number;
  risk: number;
}

export interface EvidenceSuggestion {
  title: string;
  importance: EvidenceImportance;
  reason: string;
  how_to_get_it: string;
}

export interface LabeledValue {
  label: string;
  value: string;
}

/** Structured output of analyzeClaim() (cahier des charges §12). */
export interface AnalyzeClaimResult {
  denial_reason: DenialReason | null;
  denial_reason_explained_simple: string;
  strengths: string[];
  weaknesses: string[];
  missing_documents: string[];
  key_dates: LabeledValue[];
  key_amounts: LabeledValue[];
  policy_issues: string[];
  possible_counterarguments: string[];
  recommended_strategy: string[];
  recommended_next_action: string;
  urgency_level: PriorityLevel;
  risk_flags: string[];
  should_appeal: boolean;
  should_request_more_info: boolean;
  should_file_complaint: boolean;
  should_consult_attorney: boolean;
  /** 0-100 confidence in this analysis given the information provided. */
  confidence_level: number;
  scores: AnalysisScores;
  evidence_checklist: EvidenceSuggestion[];
}

export interface AnalysisDocumentInput {
  category: string;
  file_name: string;
  excerpt: string | null;
}

export interface ClaimAnalysisInput {
  claim: Claim;
  documents: AnalysisDocumentInput[];
}
