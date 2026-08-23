"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  MAX_FILE_SIZE,
  isAllowedMime,
  DEFAULT_BUCKET,
} from "@/lib/documents/constants";
import { extractText, extractEntities } from "@/lib/documents/extract";
import { CASE_DOCUMENT_CATEGORIES } from "@/lib/claimguard/enums";
import type { CaseDocumentCategory } from "@/lib/claimguard/enums";
import type { CaseDocument } from "@/lib/claimguard/types";

/**
 * Case document vault (cahier des charges §11/§62-2).
 *
 * Reuses the existing `claim-documents` private bucket (path-prefixed by the
 * user id) so no new storage config is required. Files are validated
 * server-side and never trusted from the client. Text extraction is
 * best-effort and deterministic here; AI enrichment happens in Priority 3.
 */

const BUCKET = env.STORAGE_BUCKET_CLAIM_DOCUMENTS || DEFAULT_BUCKET;

export interface RegisterCaseDocumentInput {
  case_id: string;
  file_name: string;
  file_path: string; // storage object path (must live under `${user.id}/`)
  mime_type: string;
  file_size: number;
  document_category: CaseDocumentCategory;
}

export interface RegisterCaseDocumentResult {
  error?: string;
  document?: CaseDocument;
}

export async function registerCaseDocument(
  input: RegisterCaseDocumentInput,
): Promise<RegisterCaseDocumentResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Le stockage n'est pas encore configuré." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  // Server-side validation (never trust the client).
  if (!isAllowedMime(input.mime_type)) {
    return { error: "Ce type de fichier n'est pas autorisé." };
  }
  if (input.file_size > MAX_FILE_SIZE) {
    return { error: "Le fichier dépasse la limite de 25 Mo." };
  }
  if (!CASE_DOCUMENT_CATEGORIES.includes(input.document_category)) {
    return { error: "Catégorie de document invalide." };
  }
  if (!input.file_path.startsWith(`${user.id}/`)) {
    return { error: "Chemin d'envoi invalide." };
  }

  const { data, error } = await supabase
    .from("case_documents")
    .insert({
      user_id: user.id,
      case_id: input.case_id,
      file_name: input.file_name,
      file_url: input.file_path,
      file_type: input.mime_type,
      mime_type: input.mime_type,
      file_size: input.file_size,
      document_category: input.document_category,
      analysis_status: "uploaded",
    })
    .select("*")
    .single<CaseDocument>();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([input.file_path]);
    return { error: error?.message ?? "Impossible d'enregistrer le document." };
  }

  let document = data;

  // Best-effort deterministic text extraction (PDF/DOCX/images via OCR).
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
          .from("case_documents")
          .update({
            extracted_text: text.slice(0, 100_000),
            extracted_fields: { dates, amounts },
            analysis_status: "processing",
          })
          .eq("id", data.id)
          .select("*")
          .single<CaseDocument>();
        if (updated) document = updated;
      }
    }
  } catch {
    // Leave as "uploaded" if extraction fails.
  }

  await supabase.from("case_timeline").insert({
    case_id: input.case_id,
    event_type: "document_uploaded",
    title: "Document ajouté",
    description: `« ${input.file_name} » ajouté au dossier.`,
    source: "client",
    metadata: { category: input.document_category },
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: input.case_id,
    action: "document_uploaded",
    source: "client",
    metadata: { file_name: input.file_name },
  });

  return { document };
}

export async function deleteCaseDocument(
  documentId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Le stockage n'est pas configuré." };

  const { data: doc } = await supabase
    .from("case_documents")
    .select("id, file_url, case_id")
    .eq("id", documentId)
    .maybeSingle<Pick<CaseDocument, "id" | "file_url" | "case_id">>();
  if (!doc) return { error: "Document introuvable." };

  if (doc.file_url) {
    await supabase.storage.from(BUCKET).remove([doc.file_url]);
  }
  const { error } = await supabase
    .from("case_documents")
    .delete()
    .eq("id", documentId);
  if (error) return { error: error.message };

  await supabase.from("case_timeline").insert({
    case_id: doc.case_id,
    event_type: "document_deleted",
    title: "Document supprimé",
    source: "client",
  });
  return {};
}

export async function getCaseDocumentSignedUrl(
  documentId: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Le stockage n'est pas configuré." };

  const { data: doc } = await supabase
    .from("case_documents")
    .select("file_url")
    .eq("id", documentId)
    .maybeSingle<Pick<CaseDocument, "file_url">>();
  if (!doc?.file_url) return { error: "Document introuvable." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_url, 60);
  if (error || !data) {
    return { error: error?.message ?? "Impossible d'ouvrir le fichier." };
  }
  return { url: data.signedUrl };
}
