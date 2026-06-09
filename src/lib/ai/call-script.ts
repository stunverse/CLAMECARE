import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import { SAFETY_RULES } from "@/lib/ai/prompts";
import { DENIAL_REASON_LABELS } from "@/lib/labels";
import { formatCurrency } from "@/lib/format";
import type { Claim } from "@/lib/types";

export interface CallScript {
  objective: string;
  summary: string;
  questions: string[];
  useful_phrases: string[];
  phrases_to_avoid: string[];
  checklist: string[];
  recap_email: string;
}

export function mockGenerateCallScript(claim: Claim): CallScript {
  const insurer = claim.insurance_company || "your insurer";
  const denial = claim.detected_denial_reason
    ? DENIAL_REASON_LABELS[claim.detected_denial_reason]
    : null;

  return {
    objective: `Get a clear, written explanation of ${insurer}'s decision and the exact next steps to dispute it.`,
    summary: `${claim.claim_title}. Claim ${claim.claim_number ?? "[Claim Number]"}, policy ${claim.policy_number ?? "[Policy Number]"}.${
      denial ? ` Decision basis on file: "${denial}".` : ""
    } Amount claimed: ${formatCurrency(claim.amount_claimed)}; offered: ${formatCurrency(claim.amount_offered)}.`,
    questions: [
      "Can you explain the specific reason for the decision?",
      "Which policy provision are you relying on?",
      "What documents, if any, are missing?",
      "What is the appeal deadline?",
      "Can you send the explanation to me in writing?",
      "Who can review or escalate this decision?",
    ],
    useful_phrases: [
      "I'd like to understand the specific basis for this decision.",
      "Could you please confirm that in writing?",
      "I want to make sure I meet any deadlines — what are they?",
      "I'm gathering documentation and would like to know exactly what you need.",
    ],
    phrases_to_avoid: [
      "Anything that admits fault or speculates about the facts.",
      "Agreeing to a number on the spot before reviewing it.",
      "Threats or emotional language — stay factual and calm.",
      "Guessing at policy terms you haven't verified.",
    ],
    checklist: [
      "Have your claim number, policy number, and denial letter in front of you.",
      "Note the representative's name and the date/time of the call.",
      "Write down each answer as you go.",
      "Ask for everything important to be confirmed in writing.",
      "Confirm the next step and any deadline before hanging up.",
    ],
    recap_email: [
      `Re: Claim ${claim.claim_number ?? "[Claim Number]"} — call summary`,
      "",
      "Dear Claims Team,",
      "",
      "Thank you for speaking with me today. To confirm our conversation: [briefly summarize what was discussed, the reason given, and any documents requested].",
      "",
      "As discussed, please confirm the following in writing: [the specific reason for the decision and the relevant policy provision], and the applicable appeal deadline.",
      "",
      "I will follow up with the requested documentation. Thank you.",
      "",
      "Sincerely,",
      "[Your Name]",
    ].join("\n"),
  };
}

export async function generateCallScript(claim: Claim): Promise<CallScript> {
  if (!isOpenAIConfigured) return mockGenerateCallScript(claim);

  try {
    const user = [
      "Prepare a phone-call script for a US insurance consumer calling their insurer about a claim. Be practical and calm; never advise admitting fault or guessing at policy terms.",
      `Claim: ${claim.claim_title}; insurer ${claim.insurance_company ?? "unknown"}; claim# ${claim.claim_number ?? "unknown"}; denial reason ${claim.detected_denial_reason ?? "unknown"}; claimed ${formatCurrency(claim.amount_claimed)}; offered ${formatCurrency(claim.amount_offered)}.`,
      "",
      'Return ONLY JSON: { "objective": string, "summary": string, "questions": string[], "useful_phrases": string[], "phrases_to_avoid": string[], "checklist": string[], "recap_email": string }.',
    ].join("\n");

    const raw = await generateJSON({
      system: SAFETY_RULES,
      user,
      temperature: 0.4,
    });
    const p = JSON.parse(raw);
    const base = mockGenerateCallScript(claim);
    const arr = (v: unknown, f: string[]) =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string") : f;
    return {
      objective:
        typeof p.objective === "string" ? p.objective : base.objective,
      summary: typeof p.summary === "string" ? p.summary : base.summary,
      questions: arr(p.questions, base.questions),
      useful_phrases: arr(p.useful_phrases, base.useful_phrases),
      phrases_to_avoid: arr(p.phrases_to_avoid, base.phrases_to_avoid),
      checklist: arr(p.checklist, base.checklist),
      recap_email:
        typeof p.recap_email === "string" ? p.recap_email : base.recap_email,
    };
  } catch {
    return mockGenerateCallScript(claim);
  }
}
