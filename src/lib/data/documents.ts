import { createClient } from "@/lib/supabase/server";
import type { ClaimDocument } from "@/lib/types";

/** Load all documents for a claim (RLS-scoped). Empty in placeholder mode. */
export async function getClaimDocuments(
  claimId: string,
): Promise<ClaimDocument[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("claim_documents")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .returns<ClaimDocument[]>();

  return data ?? [];
}
