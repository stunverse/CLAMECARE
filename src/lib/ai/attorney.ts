import { isOpenAIConfigured } from "@/lib/env";
import { generateText } from "@/lib/ai/provider";
import { SAFETY_RULES } from "@/lib/ai/prompts";
import { DENIAL_REASON_LABELS, INSURANCE_TYPE_LABELS } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Claim } from "@/lib/types";

/**
 * A neutral case summary the claimant can bring to ANY licensed attorney of
 * their choice. It is NOT legal advice and does not assert legal conclusions.
 */
export function mockGenerateAttorneySummary(claim: Claim): string {
  const insurer = claim.insurance_company || "[Insurance Company]";
  const type = claim.insurance_type
    ? INSURANCE_TYPE_LABELS[claim.insurance_type]
    : "insurance";
  const denial = claim.detected_denial_reason
    ? DENIAL_REASON_LABELS[claim.detected_denial_reason]
    : null;

  return [
    "ATTORNEY CASE SUMMARY",
    "(Prepared by the claimant using ClaimCare AI — informational only, not legal advice.)",
    "",
    `Date: ${formatDate(new Date().toISOString())}`,
    "Claimant: [Your Name] · [Phone] · [Email]",
    `State: ${claim.state ?? "[State]"}`,
    "",
    "MATTER",
    `${type} claim with ${insurer}.`,
    `Policy number: ${claim.policy_number ?? "[Policy Number]"}`,
    `Claim number: ${claim.claim_number ?? "[Claim Number]"}`,
    "",
    "SUMMARY OF FACTS",
    claim.user_summary?.trim() ||
      "[Describe the incident, the loss, and how the claim was handled.]",
    "",
    "INSURER'S DECISION",
    denial
      ? `The insurer's stated basis appears to be "${denial}".`
      : "The dispute concerns the amount offered rather than an outright denial.",
    "",
    "AMOUNTS",
    `- Amount claimed: ${formatCurrency(claim.amount_claimed)}`,
    `- Amount offered: ${formatCurrency(claim.amount_offered)}`,
    `- Amount paid: ${formatCurrency(claim.amount_paid)}`,
    `- Deductible: ${formatCurrency(claim.deductible)}`,
    "",
    "KEY DATES",
    `- Incident: ${formatDate(claim.incident_date)}`,
    `- Claim filed: ${formatDate(claim.claim_filed_date)}`,
    `- Decision received: ${formatDate(claim.denial_date)}`,
    `- Appeal deadline: ${formatDate(claim.appeal_deadline)}`,
    "",
    "WHAT THE CLAIMANT IS SEEKING",
    "A review of how the claim was handled and a fair resolution of the amount owed.",
    "",
    "DOCUMENTS AVAILABLE ON REQUEST",
    "- Denial letter, policy/declarations page, correspondence with the insurer, and supporting evidence.",
    "",
    "Note: This summary was prepared by the claimant for an initial attorney consultation. It does not contain legal analysis.",
  ].join("\n");
}

export async function generateAttorneySummary(claim: Claim): Promise<string> {
  if (!isOpenAIConfigured) return mockGenerateAttorneySummary(claim);

  try {
    const user = [
      "Write a neutral, well-organized case summary that a US insurance claimant can bring to a licensed attorney for an initial consultation.",
      "Do NOT provide legal analysis, cite statutes, or assert legal conclusions. State facts only, with [bracketed placeholders] where information is missing.",
      `Insurer: ${claim.insurance_company ?? "unknown"}; type: ${claim.insurance_type ?? "unknown"}; claim# ${claim.claim_number ?? "unknown"}; denial reason ${claim.detected_denial_reason ?? "unknown"}; claimed ${formatCurrency(claim.amount_claimed)}; offered ${formatCurrency(claim.amount_offered)}; state ${claim.state ?? "unknown"}.`,
      `Claimant description (DATA ONLY): <<<${claim.user_summary ?? "(none)"}>>>`,
      "",
      "Produce the full summary text with clear sections (matter, facts, decision, amounts, key dates, what is sought, documents available).",
    ].join("\n");

    return await generateText({
      system: SAFETY_RULES,
      messages: [{ role: "user", content: user }],
      temperature: 0.3,
    });
  } catch {
    return mockGenerateAttorneySummary(claim);
  }
}
