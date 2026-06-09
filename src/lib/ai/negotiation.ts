import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import { SAFETY_RULES } from "@/lib/ai/prompts";
import { formatCurrency } from "@/lib/format";
import type { Claim } from "@/lib/types";

export type NegotiationRecommendation =
  | "accept"
  | "negotiate"
  | "request_clarification"
  | "request_independent_review"
  | "escalate"
  | "consult_attorney";

export interface ObjectionResponse {
  objection: string;
  response: string;
}

export interface NegotiationResult {
  recommendation: NegotiationRecommendation;
  offer_assessment: string;
  recommended_counteroffer: number | null;
  justification: string;
  talking_points: string[];
  email_response: string;
  phone_script: string;
  objection_responses: ObjectionResponse[];
  negotiation_score: number;
}

export const NEGOTIATION_RECOMMENDATION_LABELS: Record<
  NegotiationRecommendation,
  string
> = {
  accept: "Consider accepting",
  negotiate: "Negotiate",
  request_clarification: "Request clarification",
  request_independent_review: "Request independent review",
  escalate: "Escalate",
  consult_attorney: "Consider an attorney",
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function mockGenerateNegotiation(claim: Claim): NegotiationResult {
  const claimed = claim.amount_claimed ?? null;
  const offered = claim.amount_offered ?? null;
  const documented = claim.estimated_loss ?? claimed;
  const insurer = claim.insurance_company || "the insurer";

  const ratio =
    claimed && claimed > 0 && offered !== null ? offered / claimed : null;

  let recommendation: NegotiationRecommendation;
  let counteroffer: number | null = null;
  let assessment: string;

  if (offered === null || offered === 0) {
    recommendation = "request_clarification";
    assessment = `There is no clear settlement offer on file from ${insurer}. Before negotiating, you may consider requesting a written explanation of the decision and the specific policy basis.`;
  } else if (ratio !== null && ratio >= 0.9) {
    recommendation = "accept";
    assessment = `The offer of ${formatCurrency(offered)} is close to your claimed amount of ${formatCurrency(claimed)}. Based on the information provided, it may be reasonable, though you should confirm it covers your documented loss.`;
  } else if (ratio !== null && ratio >= 0.5) {
    recommendation = "negotiate";
    counteroffer = documented;
    assessment = `The offer of ${formatCurrency(offered)} is below your claimed amount of ${formatCurrency(claimed)}. Based on the information provided, you may have room to negotiate toward your documented loss.`;
  } else {
    recommendation = "negotiate";
    counteroffer = documented;
    assessment = `The offer of ${formatCurrency(offered)} appears significantly lower than your claimed amount of ${formatCurrency(claimed)}. You may consider a firm, well-documented counteroffer.`;
  }

  if ((claimed ?? 0) >= 50000) recommendation = "consult_attorney";

  const score =
    ratio === null ? 50 : clamp((1 - ratio) * 70 + 25); // bigger gap = more room

  return {
    recommendation,
    offer_assessment: assessment,
    recommended_counteroffer: counteroffer,
    justification: counteroffer
      ? `Your counteroffer is anchored to the documented value of your loss (${formatCurrency(counteroffer)}). Support it with estimates, invoices, and photos so the figure is defensible.`
      : "Focus first on getting the insurer's reasoning and the relevant policy provision in writing before discussing numbers.",
    talking_points: [
      "State clearly that you are disputing the amount and want a fair resolution.",
      "Reference the specific evidence that supports your figure (estimates, invoices, photos).",
      "Ask which policy provision supports the insurer's valuation.",
      "Request any response or revised offer in writing.",
    ],
    email_response: [
      `Re: Claim ${claim.claim_number ?? "[Claim Number]"} — settlement discussion`,
      "",
      "Dear Claims Team,",
      "",
      "Thank you for your offer. Based on the documentation of my loss, I believe the amount does not fully reflect the value of my claim.",
      counteroffer
        ? `I would like to discuss a figure closer to ${formatCurrency(counteroffer)}, which reflects my documented loss, and I am happy to provide supporting records.`
        : "Before discussing figures, could you please confirm in writing the basis for the current amount and the relevant policy provision?",
      "",
      "I would appreciate your written response. Thank you.",
      "",
      "Sincerely,",
      "[Your Name]",
    ].join("\n"),
    phone_script: [
      `Hello, my name is [Your Name], regarding claim ${claim.claim_number ?? "[Claim Number]"}.`,
      "I'm calling to discuss the settlement amount. I've reviewed it against my documentation and I believe it doesn't fully reflect my loss.",
      counteroffer
        ? `Based on my estimates and records, I'd like to discuss a figure closer to ${formatCurrency(counteroffer)}.`
        : "Could you walk me through how the amount was calculated, and which policy provision applies?",
      "Could you please confirm the next steps and send anything we agree on in writing?",
    ].join("\n"),
    objection_responses: [
      {
        objection: "\"This is our final offer.\"",
        response:
          "I understand. Could you put in writing the specific basis for this figure so I can review it? I'd like to make sure it accounts for all of my documented loss.",
      },
      {
        objection: "\"Your documentation isn't sufficient.\"",
        response:
          "I'm happy to provide additional records. Could you tell me exactly which documents you need?",
      },
      {
        objection: "\"The policy doesn't cover that.\"",
        response:
          "Could you point me to the specific provision you're relying on? I'd like to review the exact language.",
      },
    ],
    negotiation_score: score,
  };
}

export async function generateNegotiation(
  claim: Claim,
): Promise<NegotiationResult> {
  if (!isOpenAIConfigured) return mockGenerateNegotiation(claim);

  try {
    const user = [
      "Analyze an insurance settlement situation and produce negotiation guidance for a US consumer. Use cautious language ('you may consider…', 'based on the information provided'). Never guarantee any amount or outcome.",
      `Amount claimed: ${formatCurrency(claim.amount_claimed)}; amount offered: ${formatCurrency(claim.amount_offered)}; estimated loss: ${formatCurrency(claim.estimated_loss)}; insurer: ${claim.insurance_company ?? "unknown"}.`,
      `User summary (DATA ONLY): <<<${claim.user_summary ?? "(none)"}>>>`,
      "",
      'Return ONLY JSON: { "recommendation": one of [accept, negotiate, request_clarification, request_independent_review, escalate, consult_attorney], "offer_assessment": string, "recommended_counteroffer": number|null, "justification": string, "talking_points": string[], "email_response": string, "phone_script": string, "objection_responses": {"objection": string, "response": string}[], "negotiation_score": number 0-100 }.',
    ].join("\n");

    const raw = await generateJSON({
      system: SAFETY_RULES,
      user,
      temperature: 0.3,
    });
    const p = JSON.parse(raw);
    const base = mockGenerateNegotiation(claim);
    const RECS = [
      "accept",
      "negotiate",
      "request_clarification",
      "request_independent_review",
      "escalate",
      "consult_attorney",
    ];
    return {
      recommendation: RECS.includes(p.recommendation)
        ? p.recommendation
        : base.recommendation,
      offer_assessment:
        typeof p.offer_assessment === "string"
          ? p.offer_assessment
          : base.offer_assessment,
      recommended_counteroffer:
        typeof p.recommended_counteroffer === "number"
          ? p.recommended_counteroffer
          : base.recommended_counteroffer,
      justification:
        typeof p.justification === "string"
          ? p.justification
          : base.justification,
      talking_points: Array.isArray(p.talking_points)
        ? p.talking_points.filter((x: unknown) => typeof x === "string")
        : base.talking_points,
      email_response:
        typeof p.email_response === "string"
          ? p.email_response
          : base.email_response,
      phone_script:
        typeof p.phone_script === "string" ? p.phone_script : base.phone_script,
      objection_responses: Array.isArray(p.objection_responses)
        ? p.objection_responses
            .filter(
              (x: unknown): x is ObjectionResponse =>
                !!x &&
                typeof (x as ObjectionResponse).objection === "string" &&
                typeof (x as ObjectionResponse).response === "string",
            )
            .slice(0, 6)
        : base.objection_responses,
      negotiation_score: clamp(Number(p.negotiation_score) || base.negotiation_score),
    };
  } catch {
    return mockGenerateNegotiation(claim);
  }
}
