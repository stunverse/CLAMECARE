"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { analyzePolicy, type PolicyAnalysisResult } from "@/lib/ai/policy";

export async function analyzePolicyAction(input: {
  claimId: string;
  policyText: string;
}): Promise<{ error?: string; result?: PolicyAnalysisResult }> {
  if (!input.policyText.trim()) {
    return { error: "Paste your policy text to begin." };
  }

  const claim = await getClaim(input.claimId);
  if (!claim) return { error: "Claim not found." };

  const result = await analyzePolicy({
    claim,
    policyText: input.policyText,
  });

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("claims")
        .update({
          policy_analysis: result,
          ...(result.policyholder_position_strength !== null
            ? { policy_score: result.policyholder_position_strength }
            : {}),
        })
        .eq("id", input.claimId);

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        claim_id: input.claimId,
        action_type: "policy_reviewed",
        action_description: "Ran a policy review.",
      });
      await supabase.from("usage_events").insert({
        user_id: user.id,
        claim_id: input.claimId,
        event_type: "ai_analysis",
      });
      revalidatePath(`/claims/${input.claimId}/policy`);
    }
  }

  return { result };
}
