import { createClient } from "@/lib/supabase/server";

export interface ActivityEntry {
  id: string;
  action_type: string;
  action_description: string | null;
  created_at: string;
}

const day = 86_400_000;
const iso = (o: number) => new Date(Date.now() + o * day).toISOString();

const DEMO_ACTIVITY: Record<string, ActivityEntry[]> = {
  "demo-1": [
    { id: "a1", action_type: "claim_created", action_description: "Claim created through onboarding.", created_at: iso(-12) },
    { id: "a2", action_type: "document_uploaded", action_description: 'Uploaded "denial-letter.pdf".', created_at: iso(-11) },
    { id: "a3", action_type: "ai_analysis_completed", action_description: "Ran a full AI analysis of the claim.", created_at: iso(-10) },
    { id: "a4", action_type: "document_generated", action_description: 'Generated "Appeal letter — Geico collision".', created_at: iso(-1) },
  ],
};

export async function getClaimActivity(
  claimId: string,
): Promise<ActivityEntry[]> {
  const supabase = await createClient();
  if (!supabase) return DEMO_ACTIVITY[claimId] ?? [];

  const { data } = await supabase
    .from("activity_logs")
    .select("id, action_type, action_description, created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<ActivityEntry[]>();

  return data ?? [];
}
