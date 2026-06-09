import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

/** Load saved messages for a claim (RLS-scoped). Empty in placeholder mode. */
export async function getClaimMessages(claimId: string): Promise<Message[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .returns<Message[]>();

  return data ?? [];
}
