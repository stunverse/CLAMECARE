import { isOpenAIConfigured } from "@/lib/env";
import { generateText, type ChatMessage } from "@/lib/ai/provider";
import { SAFETY_RULES } from "@/lib/ai/prompts";
import { getNextAction } from "@/lib/claim-actions";
import { INSURANCE_TYPE_LABELS, DENIAL_REASON_LABELS } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Claim } from "@/lib/types";

/** Quick prompts shown above the chat (cahier des charges §25). */
export const COACH_QUICK_PROMPTS = [
  "What should I do next?",
  "Explain this denial.",
  "What documents are missing?",
  "Draft a response.",
  "Prepare a phone call.",
  "Should I file a complaint?",
  "Should I consult an attorney?",
] as const;

export interface CoachSource {
  title: string;
  chunk_text: string;
  source_url: string | null;
}

export interface CoachInput {
  claim: Claim;
  history: ChatMessage[];
  question: string;
  evidenceTitles?: string[];
  sources?: CoachSource[];
}

function buildSystem(
  claim: Claim,
  evidenceTitles?: string[],
  sources?: CoachSource[],
): string {
  const facts = [
    `Title: ${claim.claim_title}`,
    `Insurance type: ${claim.insurance_type ?? "unknown"}`,
    `Insurer: ${claim.insurance_company ?? "unknown"}`,
    `State: ${claim.state ?? "unknown"}`,
    `Status: ${claim.current_status}`,
    `Detected denial reason: ${claim.detected_denial_reason ?? "unknown"}`,
    `Amount claimed: ${formatCurrency(claim.amount_claimed)}`,
    `Amount offered: ${formatCurrency(claim.amount_offered)}`,
    `Appeal deadline: ${formatDate(claim.appeal_deadline)}`,
    `Success score: ${claim.success_score ?? "n/a"}`,
    claim.ai_summary ? `AI summary: ${claim.ai_summary}` : "",
    evidenceTitles?.length
      ? `Evidence checklist items: ${evidenceTitles.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const sourcesBlock =
    sources && sources.length
      ? `\n\nKNOWLEDGE BASE SOURCES (verified reference material — use these when relevant and cite the source title; if the answer is not in these sources and you are not certain, say you cannot confirm it and recommend verifying with the official source):\n${sources
          .map(
            (s, i) =>
              `[Source ${i + 1}: ${s.title}${s.source_url ? ` — ${s.source_url}` : ""}]\n${s.chunk_text}`,
          )
          .join("\n\n")}`
      : "";

  return `${SAFETY_RULES}

You are the ClaimCare AI Claim Coach. You are helping the user with this specific claim. Be concise, supportive, and practical. Give concrete next steps. Explain insurance terms simply. When a question is legal in nature, remind the user you are not a lawyer and suggest consulting a licensed attorney. Do not invent laws, regulations, or policy clauses — if the knowledge base sources below do not contain the answer, say you cannot confirm it.

CLAIM CONTEXT (trusted):
${facts}${sourcesBlock}`;
}

function mockCoachReply(input: CoachInput): string {
  const { claim, question } = input;
  const q = question.toLowerCase();
  const next = getNextAction(claim);
  const denial = claim.detected_denial_reason
    ? DENIAL_REASON_LABELS[claim.detected_denial_reason]
    : null;
  const typeLabel = claim.insurance_type
    ? INSURANCE_TYPE_LABELS[claim.insurance_type].toLowerCase()
    : "insurance";

  if (q.includes("next") || q.includes("do")) {
    return `Based on the information provided, your best next step is: ${next.label}. Open the relevant tab to continue. Keep copies of everything you send and note any deadlines.`;
  }
  if (q.includes("deny") || q.includes("denial") || q.includes("denied")) {
    return denial
      ? `Your ${typeLabel} claim appears to have been flagged for "${denial}". Focus your response on directly addressing that reason with documentation. I can't confirm the insurer's internal rationale — ask them to put the specific policy provision in writing.`
      : `I don't have a confirmed denial reason on file yet. Run a full analysis or upload the denial letter so I can be specific.`;
  }
  if (q.includes("document") || q.includes("missing") || q.includes("evidence")) {
    const items = input.evidenceTitles?.slice(0, 4).join(", ");
    return items
      ? `The evidence that tends to strengthen a claim like yours includes: ${items}. Check the Evidence tab to see what's still missing.`
      : `Run a full analysis to generate a tailored evidence checklist, then I can tell you exactly what's missing.`;
  }
  if (q.includes("complaint")) {
    return `If your insurer is unresponsive, acting in bad faith, or has denied your claim without a clear basis, you may consider filing a complaint with your state's Department of Insurance. Verify the procedure and deadlines with the official source before filing.`;
  }
  if (q.includes("attorney") || q.includes("lawyer")) {
    return `I'm not a lawyer and can't give legal advice. Consulting a licensed attorney is worth considering if your claim is high-value, involves serious injury, suspected bad faith, or a critical deadline. For many smaller claims, an appeal or complaint may be enough first.`;
  }
  if (q.includes("draft") || q.includes("respond") || q.includes("email")) {
    return `I can help you draft a response. Head to the Letters tab to generate an appeal or response letter, then edit it to fit your situation. Tell me the key point you want to make and I'll help shape it.`;
  }
  if (q.includes("call") || q.includes("phone")) {
    return `Before you call, write down: your claim number, the specific denial reason, and the exact questions you want answered (e.g. "Which policy provision are you relying on?"). Ask them to confirm anything important in writing. The Negotiation tab will include a call script.`;
  }
  return `Here's how I'd approach this: ${next.label}. Tell me more about what you're trying to do — for example, understanding the denial, finding missing documents, or drafting a response — and I'll give you specific steps. (This is informational only, not legal advice.)`;
}

export async function answerClaimCoach(input: CoachInput): Promise<string> {
  if (!isOpenAIConfigured) return mockCoachReply(input);

  try {
    return await generateText({
      system: buildSystem(input.claim, input.evidenceTitles, input.sources),
      messages: [...input.history, { role: "user", content: input.question }],
    });
  } catch {
    return mockCoachReply(input);
  }
}
