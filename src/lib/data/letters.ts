import { createClient } from "@/lib/supabase/server";
import type { GeneratedDocument } from "@/lib/types";

/** Load generated documents for a claim (RLS-scoped). Empty in placeholder mode. */
export async function getClaimLetters(
  claimId: string,
): Promise<GeneratedDocument[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .returns<GeneratedDocument[]>();

  return data ?? [];
}
