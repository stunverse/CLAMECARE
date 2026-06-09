"use server";

import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { generateCallScript, type CallScript } from "@/lib/ai/call-script";

export async function generateCallScriptAction(
  claimId: string,
): Promise<{ error?: string; script?: CallScript }> {
  const claim = await getClaim(claimId);
  if (!claim) return { error: "Claim not found." };

  const script = await generateCallScript(claim);

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("usage_events").insert({
        user_id: user.id,
        claim_id: claimId,
        event_type: "ai_analysis",
      });
    }
  }

  return { script };
}
