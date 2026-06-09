import { createClient } from "@/lib/supabase/server";
import type { EvidenceItem } from "@/lib/types";

/** Load evidence items for a claim (RLS-scoped). Empty in placeholder mode. */
export async function getClaimEvidence(
  claimId: string,
): Promise<EvidenceItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: true })
    .returns<EvidenceItem[]>();

  return data ?? [];
}
