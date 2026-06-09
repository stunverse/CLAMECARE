import { createClient } from "@/lib/supabase/server";
import type { Complaint } from "@/lib/types";

/** Load the complaint for a claim (RLS-scoped). Null in placeholder mode. */
export async function getComplaint(claimId: string): Promise<Complaint | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("complaints")
    .select("*")
    .eq("claim_id", claimId)
    .maybeSingle<Complaint>();

  return data ?? null;
}
