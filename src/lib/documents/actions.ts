"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  MAX_FILE_SIZE,
  isAllowedMime,
  DEFAULT_BUCKET,
} from "@/lib/documents/constants";
import { extractText, extractEntities } from "@/lib/documents/extract";
import { DOCUMENT_CATEGORIES } from "@/lib/types/enums";
import type { ClaimDocument, DocumentCategory } from "@/lib/types";

const BUCKET = env.STORAGE_BUCKET_CLAIM_DOCUMENTS || DEFAULT_BUCKET;

export interface RegisterDocumentInput {
  claim_id: string;
  file_name: string;
  file_path: string; // storage object path
  mime_type: string;
  file_size: number;
  document_category: DocumentCategory;
}

export interface RegisterDocumentResult {
  error?: string;
  document?: ClaimDocument;
}

export async function registerDocument(
  input: RegisterDocumentInput,
): Promise<RegisterDocumentResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Storage is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  // Server-side validation (never trust the client).
  if (!isAllowedMime(input.mime_type)) {
    return { error: "This file type is not allowed." };
  }
  if (input.file_size > MAX_FILE_SIZE) {
    return { error: "File exceeds the 25 MB limit." };
  }
  if (!DOCUMENT_CATEGORIES.includes(input.document_category)) {
    return { error: "Invalid document category." };
  }
  // The path must live under the user's own folder.
  if (!input.file_path.startsWith(`${user.id}/`)) {
    return { error: "Invalid upload path." };
  }

  const { data, error } = await supabase
    .from("claim_documents")
    .insert({
      user_id: user.id,
      claim_id: input.claim_id,
      file_name: input.file_name,
      file_url: input.file_path,
      file_type: input.mime_type,
      mime_type: input.mime_type,
      file_size: input.file_size,
      document_category: input.document_category,
      analysis_status: "uploaded",
    })
    .select("*")
    .single<ClaimDocument>();

  if (error || !data) {
    // Roll back the orphaned storage object on DB failure.
    await supabase.storage.from(BUCKET).remove([input.file_path]);
    return { error: error?.message ?? "Could not save the document." };
  }

  let document = data;

  // Best-effort server-side text extraction (PDF/DOCX/text).
  try {
    const { data: blob } = await supabase.storage
      .from(BUCKET)
      .download(input.file_path);
    if (blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      const text = await extractText(buffer, input.mime_type);
      if (text) {
        const { dates, amounts } = extractEntities(text);
        const { data: updated } = await supabase
          .from("claim_documents")
          .update({
            extracted_text: text.slice(0, 100_000),
            extracted_dates: dates,
            extracted_amounts: amounts,
            analysis_status: "analyzed",
          })
          .eq("id", data.id)
          .select("*")
          .single<ClaimDocument>();
        if (updated) document = updated;
      }
    }
  } catch {
    // Leave the document as "uploaded" if extraction fails.
  }

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    claim_id: input.claim_id,
    action_type: "document_uploaded",
    action_description: `Uploaded "${input.file_name}".`,
  });

  return { document };
}

export async function deleteDocument(
  documentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Storage is not configured." };

  const { data: doc } = await supabase
    .from("claim_documents")
    .select("id, file_url, claim_id")
    .eq("id", documentId)
    .maybeSingle<Pick<ClaimDocument, "id" | "file_url" | "claim_id">>();

  if (!doc) return { error: "Document not found." };

  if (doc.file_url) {
    await supabase.storage.from(BUCKET).remove([doc.file_url]);
  }

  const { error } = await supabase
    .from("claim_documents")
    .delete()
    .eq("id", documentId);
  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    claim_id: doc.claim_id,
    action_type: "document_deleted",
    action_description: "Deleted a document.",
  });

  return {};
}

export async function getDocumentSignedUrl(
  documentId: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Storage is not configured." };

  const { data: doc } = await supabase
    .from("claim_documents")
    .select("file_url")
    .eq("id", documentId)
    .maybeSingle<Pick<ClaimDocument, "file_url">>();

  if (!doc?.file_url) return { error: "Document not found." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_url, 60); // valid for 60s

  if (error || !data) return { error: error?.message ?? "Could not open file." };
  return { url: data.signedUrl };
}
