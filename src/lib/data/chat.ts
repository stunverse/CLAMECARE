import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/ai/provider";

/** Load the coach chat history for a claim (RLS-scoped). Empty in demo mode. */
export async function getClaimChat(claimId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("claim_id", claimId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .returns<{ role: "user" | "assistant"; content: string }[]>();

  return data ?? [];
}
