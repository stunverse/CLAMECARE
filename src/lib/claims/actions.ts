"use server";

import { createClient } from "@/lib/supabase/server";
import { FREE_QUOTA } from "@/lib/billing/plans";
import { INSURANCE_TYPE_LABELS, ISSUE_TYPE_LABELS } from "@/lib/labels";
import { daysUntil } from "@/lib/format";
import type {
  InsuranceType,
  IssueType,
  PriorityLevel,
} from "@/lib/types/enums";

export interface CreateClaimInput {
  insurance_type: InsuranceType | null;
  issue_type: IssueType | null;
  insurance_company: string | null;
  state: string | null;
  incident_state: string | null;
  policy_number: string | null;
  claim_number: string | null;
  adjuster_name: string | null;
  adjuster_email: string | null;
  adjuster_phone: string | null;
  amount_claimed: number | null;
  amount_offered: number | null;
  amount_paid: number | null;
  estimated_loss: number | null;
  deductible: number | null;
  incident_date: string | null;
  claim_filed_date: string | null;
  denial_date: string | null;
  last_response_date: string | null;
  appeal_deadline: string | null;
  user_summary: string | null;
}

export interface CreateClaimResult {
  error?: string;
  claimId?: string;
  isDemo?: boolean;
}

function buildTitle(input: CreateClaimInput): string {
  const typeLabel = input.insurance_type
    ? INSURANCE_TYPE_LABELS[input.insurance_type]
    : "Insurance";
  const subject = input.insurance_company || typeLabel;
  const issue = input.issue_type
    ? ISSUE_TYPE_LABELS[input.issue_type].replace(/^(My |I )/, "")
    : "claim";
  return `${subject} — ${issue}`.slice(0, 120);
}

function computePriority(input: CreateClaimInput): PriorityLevel {
  const days = daysUntil(input.appeal_deadline);
  if (days !== null) {
    if (days <= 7) return "urgent";
    if (days <= 14) return "high";
  }
  return "medium";
}

export async function createClaim(
  input: CreateClaimInput,
): Promise<CreateClaimResult> {
  if (!input.insurance_type) {
    return { error: "Please choose an insurance type." };
  }
  if (!input.issue_type) {
    return { error: "Please choose your current situation." };
  }

  const supabase = await createClient();

  // Placeholder mode: pretend success so the flow is fully demoable.
  if (!supabase) {
    return { isDemo: true, claimId: "demo" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in to create a claim." };
  }

  // Enforce the plan's active-claims quota.
  const { data: limits } = await supabase
    .from("usage_limits")
    .select("active_claims_limit")
    .eq("user_id", user.id)
    .maybeSingle<{ active_claims_limit: number | null }>();
  const activeLimit =
    limits?.active_claims_limit ?? FREE_QUOTA.active_claims_limit;
  if (activeLimit !== null) {
    const { count } = await supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .not("current_status", "in", "(resolved,abandoned)");
    if ((count ?? 0) >= activeLimit) {
      return {
        error: `You've reached your plan's limit of ${activeLimit} active claim${activeLimit === 1 ? "" : "s"}. Upgrade your plan to add more.`,
      };
    }
  }

  const payload = {
    user_id: user.id,
    claim_title: buildTitle(input),
    current_status: "draft" as const,
    priority_level: computePriority(input),
    ...input,
  };

  const { data, error } = await supabase
    .from("claims")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return { error: error?.message ?? "Could not create the claim." };
  }

  // Best-effort audit trail (cahier des charges §33).
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: data.id,
    action_type: "claim_created",
    action_description: "Claim created through onboarding.",
  });

  return { claimId: data.id };
}
