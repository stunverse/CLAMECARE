"use server";

import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { answerClaimCoach } from "@/lib/ai/coach";
import { mockAnalyzeClaim } from "@/lib/ai/mock";
import type { ChatMessage } from "@/lib/ai/provider";
import type { EvidenceItem } from "@/lib/types";

export async function sendCoachMessage(input: {
  claimId: string;
  content: string;
  history: ChatMessage[];
}): Promise<{ error?: string; reply?: string }> {
  const content = input.content.trim();
  if (!content) return { error: "Message is empty." };

  const claim = await getClaim(input.claimId);
  if (!claim) return { error: "Claim not found." };

  const supabase = await createClient();

  // Evidence context for the coach.
  let evidenceTitles: string[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("evidence_items")
      .select("title")
      .eq("claim_id", input.claimId)
      .returns<Pick<EvidenceItem, "title">[]>();
    evidenceTitles = (data ?? []).map((d) => d.title);
  }
  if (evidenceTitles.length === 0) {
    evidenceTitles = mockAnalyzeClaim({ claim, documents: [] })
      .evidence_checklist.map((e) => e.title);
  }

  const reply = await answerClaimCoach({
    claim,
    history: input.history.slice(-10),
    question: content,
    evidenceTitles,
  });

  // Persist the exchange when signed in.
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("ai_chat_messages").insert([
        {
          claim_id: input.claimId,
          user_id: user.id,
          role: "user",
          content,
        },
        {
          claim_id: input.claimId,
          user_id: user.id,
          role: "assistant",
          content: reply,
        },
      ]);
      await supabase.from("usage_events").insert({
        user_id: user.id,
        claim_id: input.claimId,
        event_type: "ai_analysis",
      });
    }
  }

  return { reply };
}
