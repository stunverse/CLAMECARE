"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeClaim, composeAiSummary } from "@/lib/ai/analyze-claim";
import { createNotification } from "@/lib/notifications/actions";
import { checkQuota, LIMIT_MESSAGE } from "@/lib/billing/quota";
import type { ClaimAnalysisInput } from "@/lib/ai/types";
import type { Claim, ClaimDocument } from "@/lib/types";

export async function runClaimAnalysis(
  claimId: string,
): Promise<{ error?: string; upgrade?: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Connect Supabase to run and save a full analysis." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const quota = await checkQuota(supabase, user.id, "ai_analysis");
  if (!quota.allowed) {
    return {
      error: `${LIMIT_MESSAGE.ai_analysis} Upgrade your plan to continue.`,
      upgrade: true,
    };
  }

  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("id", claimId)
    .maybeSingle<Claim>();
  if (!claim) return { error: "Claim not found." };

  const { data: docs } = await supabase
    .from("claim_documents")
    .select("document_category, file_name, extracted_text")
    .eq("claim_id", claimId)
    .returns<
      Pick<ClaimDocument, "document_category" | "file_name" | "extracted_text">[]
    >();

  const input: ClaimAnalysisInput = {
    claim,
    documents: (docs ?? []).map((d) => ({
      category: d.document_category,
      file_name: d.file_name,
      excerpt: d.extracted_text ? d.extracted_text.slice(0, 4000) : null,
    })),
  };

  const result = await analyzeClaim(input);

  // Persist summary, scores, denial reason, status, priority + raw analysis.
  const { error: updateError } = await supabase
    .from("claims")
    .update({
      ai_summary: composeAiSummary(result),
      ai_analysis: result,
      detected_denial_reason: result.denial_reason,
      success_score: result.scores.success,
      evidence_score: result.scores.evidence,
      policy_score: result.scores.policy,
      timeline_score: result.scores.timeline,
      consistency_score: result.scores.consistency,
      negotiation_score: result.scores.negotiation,
      risk_score: result.scores.risk,
      priority_level: result.urgency_level,
      current_status:
        claim.current_status === "draft" ||
        claim.current_status === "documents_missing" ||
        claim.current_status === "ready_for_analysis"
          ? "ai_analysis_completed"
          : claim.current_status,
    })
    .eq("id", claimId);

  if (updateError) return { error: updateError.message };

  // Regenerate the evidence checklist (idempotent re-run).
  await supabase.from("evidence_items").delete().eq("claim_id", claimId);
  if (result.evidence_checklist.length) {
    await supabase.from("evidence_items").insert(
      result.evidence_checklist.map((e) => ({
        claim_id: claimId,
        title: e.title,
        importance: e.importance,
        status: "missing" as const,
        ai_reason: e.reason,
        how_to_get_it: e.how_to_get_it,
      })),
    );
  }

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: claimId,
    action_type: "ai_analysis_completed",
    action_description: "Ran a full AI analysis of the claim.",
  });

  await supabase.from("usage_events").insert({
    user_id: user.id,
    claim_id: claimId,
    event_type: "ai_analysis",
  });

  await createNotification(supabase, {
    user_id: user.id,
    claim_id: claimId,
    type: "ai_analysis_complete",
    title: "AI analysis complete",
    message: `Your analysis for "${claim.claim_title}" is ready to review.`,
    action_url: `/claims/${claimId}/analysis`,
  });

  revalidatePath(`/claims/${claimId}`);
  revalidatePath(`/claims/${claimId}/analysis`);
  revalidatePath(`/claims/${claimId}/evidence`);
  return {};
}
