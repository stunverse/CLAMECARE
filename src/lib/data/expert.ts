import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ExpertReview } from "@/lib/types";

/** Expert review requests for a claim (RLS-scoped to the owner). */
export async function getClaimExpertReviews(
  claimId: string,
): Promise<ExpertReview[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("expert_reviews")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .returns<ExpertReview[]>();

  return data ?? [];
}

/** All expert review requests (admin view). */
export async function getAllExpertReviews(
  supabase: SupabaseClient,
): Promise<ExpertReview[]> {
  const { data } = await supabase
    .from("expert_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<ExpertReview[]>();
  return data ?? [];
}
