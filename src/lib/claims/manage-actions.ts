"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/actions";
import { CLAIM_STATUSES } from "@/lib/types/enums";
import { CLAIM_STATUS_LABELS } from "@/lib/labels";
import type { CreateClaimInput } from "@/lib/claims/actions";
import type { ClaimStatus } from "@/lib/types/enums";

export interface UpdateClaimInput extends CreateClaimInput {
  claim_title: string;
}

export async function updateClaim(
  claimId: string,
  input: UpdateClaimInput,
): Promise<{ error?: string }> {
  if (!input.claim_title.trim()) return { error: "Title is required." };

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to edit this claim." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("claims")
    .update({
      claim_title: input.claim_title.trim(),
      insurance_type: input.insurance_type,
      issue_type: input.issue_type,
      insurance_company: input.insurance_company,
      state: input.state,
      incident_state: input.incident_state,
      policy_number: input.policy_number,
      claim_number: input.claim_number,
      adjuster_name: input.adjuster_name,
      adjuster_email: input.adjuster_email,
      adjuster_phone: input.adjuster_phone,
      amount_claimed: input.amount_claimed,
      amount_offered: input.amount_offered,
      amount_paid: input.amount_paid,
      estimated_loss: input.estimated_loss,
      deductible: input.deductible,
      incident_date: input.incident_date,
      claim_filed_date: input.claim_filed_date,
      denial_date: input.denial_date,
      last_response_date: input.last_response_date,
      appeal_deadline: input.appeal_deadline,
      user_summary: input.user_summary,
    })
    .eq("id", claimId);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: claimId,
    action_type: "claim_updated",
    action_description: "Updated claim information.",
  });

  revalidatePath(`/claims/${claimId}`);
  return {};
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
): Promise<{ error?: string }> {
  if (!CLAIM_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to update status." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("claims")
    .update({ current_status: status })
    .eq("id", claimId);
  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: claimId,
    action_type: "status_changed",
    action_description: `Status changed to "${CLAIM_STATUS_LABELS[status]}".`,
  });
  await createNotification(supabase, {
    user_id: user.id,
    claim_id: claimId,
    type: "claim_status_updated",
    title: "Claim status updated",
    message: `Status is now "${CLAIM_STATUS_LABELS[status]}".`,
    action_url: `/claims/${claimId}`,
  });

  revalidatePath(`/claims/${claimId}`);
  return {};
}

export async function addClaimNote(
  claimId: string,
  note: string,
): Promise<{ error?: string }> {
  if (!note.trim()) return { error: "Note is empty." };

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to add notes." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: claimId,
    action_type: "note",
    action_description: note.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/claims/${claimId}/activity`);
  return {};
}
