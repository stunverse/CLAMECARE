import { createClient } from "@/lib/supabase/server";
import type { AttorneyReferral } from "@/lib/types";

/** Load the attorney referral/consent row for a claim, if any. */
export async function getAttorneyReferral(
  claimId: string,
): Promise<AttorneyReferral | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("attorney_referrals")
    .select("*")
    .eq("claim_id", claimId)
    .maybeSingle<AttorneyReferral>();

  return data ?? null;
}
