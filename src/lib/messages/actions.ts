"use server";

import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import {
  analyzeMessage,
  MESSAGE_RESPONSE_TYPES,
  type MessageAnalysis,
  type MessageResponseType,
} from "@/lib/ai/analyze-message";
import { DOCUMENT_TONES } from "@/lib/types/enums";
import type { DocumentTone } from "@/lib/types";

export async function analyzeMessageAction(input: {
  claimId: string;
  body: string;
  tone: DocumentTone;
  responseType: MessageResponseType;
}): Promise<{ error?: string; analysis?: MessageAnalysis }> {
  if (!input.body.trim()) return { error: "Paste the email you received." };
  if (!DOCUMENT_TONES.includes(input.tone)) return { error: "Invalid tone." };
  if (!MESSAGE_RESPONSE_TYPES.includes(input.responseType)) {
    return { error: "Invalid response type." };
  }

  const claim = await getClaim(input.claimId);
  if (!claim) return { error: "Claim not found." };

  const analysis = await analyzeMessage({
    claim,
    body: input.body,
    tone: input.tone,
    responseType: input.responseType,
  });
  return { analysis };
}

export async function saveMessageAction(input: {
  claimId: string;
  body: string;
  summary: string;
  detected_requests: string[];
  detected_deadlines: string[];
  reply: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to save messages." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("messages").insert([
    {
      claim_id: input.claimId,
      user_id: user.id,
      direction: "inbound",
      sender: "Insurer",
      body: input.body,
      ai_summary: input.summary,
      detected_requests: input.detected_requests,
      detected_deadlines: input.detected_deadlines,
    },
    {
      claim_id: input.claimId,
      user_id: user.id,
      direction: "outbound",
      recipient: "Insurer",
      body: input.reply,
    },
  ]);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: input.claimId,
    action_type: "message_saved",
    action_description: "Saved an insurer message and drafted reply.",
  });
  return {};
}
