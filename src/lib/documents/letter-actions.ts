"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { generateLetter } from "@/lib/ai/generate-letter";
import { createNotification } from "@/lib/notifications/actions";
import { GENERATED_DOCUMENT_TYPE_LABELS } from "@/lib/labels";
import { GENERATED_DOCUMENT_TYPES, DOCUMENT_TONES } from "@/lib/types/enums";
import type {
  Claim,
  GeneratedDocument,
  DocumentTone,
  GeneratedDocumentType,
} from "@/lib/types";

export interface GenerateLetterResult {
  error?: string;
  document?: GeneratedDocument;
}

export async function generateLetterAction(input: {
  claimId: string;
  documentType: GeneratedDocumentType;
  tone: DocumentTone;
}): Promise<GenerateLetterResult> {
  if (!GENERATED_DOCUMENT_TYPES.includes(input.documentType)) {
    return { error: "Invalid document type." };
  }
  if (!DOCUMENT_TONES.includes(input.tone)) {
    return { error: "Invalid tone." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Connect Supabase to generate and save letters." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("id", input.claimId)
    .maybeSingle<Claim>();
  if (!claim) return { error: "Claim not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null }>();
  const senderName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  const letter = await generateLetter({
    claim,
    documentType: input.documentType,
    tone: input.tone,
    senderName,
  });

  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      user_id: user.id,
      claim_id: input.claimId,
      document_type: input.documentType,
      title:
        letter.subject ||
        GENERATED_DOCUMENT_TYPE_LABELS[input.documentType],
      content: letter.body,
      tone: input.tone,
      status: "draft",
    })
    .select("*")
    .single<GeneratedDocument>();

  if (error || !data) {
    return { error: error?.message ?? "Could not save the letter." };
  }

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: input.claimId,
    action_type: "document_generated",
    action_description: `Generated "${data.title}".`,
  });
  await supabase.from("usage_events").insert({
    user_id: user.id,
    claim_id: input.claimId,
    event_type: "document_generated",
  });

  if (input.documentType === "appeal_letter") {
    await createNotification(supabase, {
      user_id: user.id,
      claim_id: input.claimId,
      type: "appeal_letter_ready",
      title: "Appeal letter ready",
      message: "Your appeal letter draft is ready to review.",
      action_url: `/claims/${input.claimId}/letters`,
    });
  }

  revalidatePath(`/claims/${input.claimId}/letters`);
  return { document: data };
}

/** Generate a letter WITHOUT saving (preview; works in demo mode too). */
export async function previewLetterAction(input: {
  claimId: string;
  documentType: GeneratedDocumentType;
  tone: DocumentTone;
}): Promise<{ error?: string; subject?: string; body?: string }> {
  const claim = await getClaim(input.claimId);
  if (!claim) return { error: "Claim not found." };

  const letter = await generateLetter({
    claim,
    documentType: input.documentType,
    tone: input.tone,
    senderName: null,
  });
  return { subject: letter.subject, body: letter.body };
}

export async function saveLetterAction(input: {
  id: string;
  title: string;
  content: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Storage is not configured." };

  const { error } = await supabase
    .from("generated_documents")
    .update({ title: input.title, content: input.content })
    .eq("id", input.id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteLetterAction(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Storage is not configured." };

  const { error } = await supabase
    .from("generated_documents")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}
