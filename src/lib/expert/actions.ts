"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EXPERT_REVIEW_TYPES, EXPERT_REVIEW_STATUSES } from "@/lib/types/enums";
import type {
  ExpertReview,
  ExpertReviewStatus,
  ExpertReviewType,
} from "@/lib/types";

export async function requestExpertReview(input: {
  claimId: string;
  reviewType: ExpertReviewType;
  note: string;
}): Promise<{ error?: string; review?: ExpertReview }> {
  if (!EXPERT_REVIEW_TYPES.includes(input.reviewType)) {
    return { error: "Invalid review type." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to request a review." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("expert_reviews")
    .insert({
      claim_id: input.claimId,
      user_id: user.id,
      review_type: input.reviewType,
      status: "requested",
      user_note: input.note.trim() || null,
    })
    .select("*")
    .single<ExpertReview>();

  if (error || !data) {
    return { error: error?.message ?? "Could not submit the request." };
  }

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: input.claimId,
    action_type: "expert_review_requested",
    action_description: "Requested a human expert review.",
  });
  await supabase.from("usage_events").insert({
    user_id: user.id,
    claim_id: input.claimId,
    event_type: "expert_review_requested",
  });

  revalidatePath(`/claims/${input.claimId}`);
  return { review: data };
}

/** Admin/expert: update a review's status (RLS permits admins/assigned expert). */
export async function updateExpertReviewStatus(input: {
  id: string;
  status: ExpertReviewStatus;
}): Promise<{ error?: string }> {
  if (!EXPERT_REVIEW_STATUSES.includes(input.status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Not connected." };

  const patch = {
    status: input.status,
    ...(input.status === "completed"
      ? { completed_at: new Date().toISOString() }
      : {}),
  };
  const { error } = await supabase
    .from("expert_reviews")
    .update(patch)
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/admin/expert-reviews");
  return {};
}
