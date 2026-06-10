"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { generateAttorneySummary } from "@/lib/ai/attorney";

export async function generateAttorneySummaryAction(
  claimId: string,
): Promise<{ error?: string; text?: string }> {
  const claim = await getClaim(claimId);
  if (!claim) return { error: "Claim not found." };

  const text = await generateAttorneySummary(claim);

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        claim_id: claimId,
        action_type: "attorney_summary_generated",
        action_description: "Generated an attorney summary.",
      });
    }
  }

  return { text };
}

/**
 * Record (or withdraw) the user's consent to be contacted if a partner
 * attorney becomes available in their state. This is a dormant pipeline:
 * it stores a lead but performs no outreach (no partners yet).
 */
export async function setAttorneyConsent(
  claimId: string,
  consent: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to save your preference." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: existing } = await supabase
    .from("attorney_referrals")
    .select("id")
    .eq("claim_id", claimId)
    .maybeSingle<{ id: string }>();

  if (!consent) {
    if (existing) {
      await supabase.from("attorney_referrals").delete().eq("id", existing.id);
    }
    revalidatePath(`/claims/${claimId}/attorney`);
    return {};
  }

  const claim = await getClaim(claimId);
  const payload = {
    claim_id: claimId,
    user_id: user.id,
    state: claim?.state ?? null,
    referral_status: "consent_given" as const,
    user_consent_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("attorney_referrals").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("attorney_referrals").insert(payload);
  }

  revalidatePath(`/claims/${claimId}/attorney`);
  return {};
}
