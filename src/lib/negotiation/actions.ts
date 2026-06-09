"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { generateNegotiation } from "@/lib/ai/negotiation";

export async function runNegotiationAction(
  claimId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Connect Supabase to run and save the analysis." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const claim = await getClaim(claimId);
  if (!claim) return { error: "Claim not found." };

  const result = await generateNegotiation(claim);

  await supabase
    .from("claims")
    .update({
      negotiation_analysis: result,
      negotiation_score: result.negotiation_score,
    })
    .eq("id", claimId);

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: claimId,
    action_type: "negotiation_generated",
    action_description: "Generated a negotiation strategy.",
  });
  await supabase.from("usage_events").insert({
    user_id: user.id,
    claim_id: claimId,
    event_type: "ai_analysis",
  });

  revalidatePath(`/claims/${claimId}/negotiation`);
  return {};
}
