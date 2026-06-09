"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import {
  getStateRegulation,
  genericRegulatorName,
} from "@/lib/data/regulations";
import { generateComplaint } from "@/lib/ai/complaint";
import { createNotification } from "@/lib/notifications/actions";
import { COMPLAINT_STATUSES } from "@/lib/types/enums";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComplaintStatus } from "@/lib/types/enums";

async function existingComplaintId(
  supabase: SupabaseClient,
  claimId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("complaints")
    .select("id")
    .eq("claim_id", claimId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function generateComplaintAction(
  claimId: string,
): Promise<{ error?: string; text?: string }> {
  const claim = await getClaim(claimId);
  if (!claim) return { error: "Claim not found." };

  const reg = await getStateRegulation(claim.state);
  const regulatorName =
    reg?.department_name || genericRegulatorName(claim.state);

  const text = await generateComplaint({ claim, regulatorName });

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const id = await existingComplaintId(supabase, claimId);
      const payload = {
        claim_id: claimId,
        user_id: user.id,
        state: claim.state,
        regulator_name: regulatorName,
        complaint_text: text,
        status: "draft_prepared" as ComplaintStatus,
      };
      if (id) {
        await supabase.from("complaints").update(payload).eq("id", id);
      } else {
        await supabase.from("complaints").insert(payload);
      }
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        claim_id: claimId,
        action_type: "complaint_prepared",
        action_description: "Prepared a regulator complaint draft.",
      });
      await supabase.from("usage_events").insert({
        user_id: user.id,
        claim_id: claimId,
        event_type: "complaint_generated",
      });
      await createNotification(supabase, {
        user_id: user.id,
        claim_id: claimId,
        type: "complaint_draft_ready",
        title: "Complaint draft ready",
        message: "Your regulator complaint draft is ready to review.",
        action_url: `/claims/${claimId}/complaint`,
      });
      revalidatePath(`/claims/${claimId}/complaint`);
    }
  }

  return { text };
}

export async function saveComplaintAction(input: {
  claimId: string;
  text: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to save." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const id = await existingComplaintId(supabase, input.claimId);
  if (id) {
    await supabase
      .from("complaints")
      .update({ complaint_text: input.text })
      .eq("id", id);
  } else {
    await supabase.from("complaints").insert({
      claim_id: input.claimId,
      user_id: user.id,
      complaint_text: input.text,
      status: "draft_prepared",
    });
  }
  return {};
}

export async function updateComplaintStatusAction(input: {
  claimId: string;
  status: ComplaintStatus;
}): Promise<{ error?: string }> {
  if (!COMPLAINT_STATUSES.includes(input.status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to update." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const id = await existingComplaintId(supabase, input.claimId);
  const patch = {
    status: input.status,
    ...(input.status === "submitted"
      ? { submitted_at: new Date().toISOString() }
      : {}),
    ...(input.status === "response_received"
      ? { response_received_at: new Date().toISOString() }
      : {}),
  };
  if (id) {
    await supabase.from("complaints").update(patch).eq("id", id);
  } else {
    await supabase
      .from("complaints")
      .insert({ claim_id: input.claimId, user_id: user.id, ...patch });
  }
  revalidatePath(`/claims/${input.claimId}/complaint`);
  return {};
}
