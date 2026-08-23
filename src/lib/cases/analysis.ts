"use server";

import { createClient } from "@/lib/supabase/server";
import { computeCompleteness } from "@/lib/cases/completeness";
import { canTransition } from "@/lib/claimguard/state-machine";
import {
  extractInvoiceFields,
  PROMPT_VERSION_INVOICE,
} from "@/lib/claimguard/ai/extract-invoice";
import {
  summarizeCase,
  PROMPT_VERSION_SUMMARY,
} from "@/lib/claimguard/ai/summarize-case";
import { env, isOpenAIConfigured } from "@/lib/env";
import type { Case, CaseDocument } from "@/lib/claimguard/types";
import type { CaseStatus } from "@/lib/claimguard/enums";

export interface AnalyzeCaseResult {
  error?: string;
  status?: CaseStatus;
  completeness?: number;
  isDemo?: boolean;
}

/** Only fill a target field when the user left it empty (AI never overrides). */
function fillIfEmpty<T>(current: T | null | undefined, extracted: T | null): T | null {
  if (current !== null && current !== undefined && current !== "") return current as T;
  return extracted;
}

/**
 * Case analysis (cahier des charges §62-3).
 *
 * Reads the extracted text of the case's invoice document(s), lets the AI
 * *extract* structured fields (validated + grounded), merges them into any
 * fields the user left empty, records an ai_classifications row, recomputes
 * the deterministic completeness score, produces a factual summary, and
 * advances the status through an ALLOWED transition — never a jump the state
 * machine forbids. The AI never decides the transition; the code does.
 */
export async function analyzeCase(caseId: string): Promise<AnalyzeCaseResult> {
  const supabase = await createClient();
  if (!supabase) return { isDemo: true, status: "ready_to_contact", completeness: 92 };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle<Case>();
  if (!row) return { error: "Dossier introuvable." };

  // Move into "under_analysis" if we're starting from draft/missing.
  if (row.status === "draft" || row.status === "missing_information") {
    if (canTransition(row.status, "under_analysis")) {
      await supabase
        .from("cases")
        .update({ status: "under_analysis" })
        .eq("id", caseId);
      await supabase.from("case_timeline").insert({
        case_id: caseId,
        event_type: "analysis_started",
        title: "Analyse en cours",
        old_status: row.status,
        new_status: "under_analysis",
        source: "ai",
      });
    }
  }

  // Gather text from invoice documents first, then any other document.
  const { data: docs } = await supabase
    .from("case_documents")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  const documents = (docs as CaseDocument[] | null) ?? [];
  const invoiceDoc =
    documents.find(
      (d) => d.document_category === "invoice" && d.extracted_text,
    ) ?? documents.find((d) => d.extracted_text);

  let extractionConfidence = 1;
  const merged: Partial<Case> = { ...row };

  if (invoiceDoc?.extracted_text) {
    const { fields, confidence, source } = await extractInvoiceFields(
      invoiceDoc.extracted_text,
    );
    extractionConfidence = confidence;

    merged.invoice_number = fillIfEmpty(row.invoice_number, fields.invoice_number);
    merged.invoice_date = fillIfEmpty(row.invoice_date, fields.invoice_date);
    merged.due_date = fillIfEmpty(row.due_date, fields.due_date);
    merged.amount_ht = fillIfEmpty(row.amount_ht, fields.amount_ht);
    merged.vat_amount = fillIfEmpty(row.vat_amount, fields.vat_amount);
    merged.original_amount = fillIfEmpty(
      row.original_amount,
      fields.total_ttc ??
        (fields.amount_ht !== null
          ? fields.amount_ht + (fields.vat_amount ?? 0)
          : null),
    );
    merged.debtor_name = fillIfEmpty(row.debtor_name, fields.debtor_name);

    // Record the classification (audit + versioned prompt).
    await supabase.from("ai_classifications").insert({
      case_id: caseId,
      kind: "invoice_extraction",
      result: fields,
      confidence,
      model: source === "ai" ? env.OPENAI_MODEL : "heuristic",
      prompt_version: PROMPT_VERSION_INVOICE,
    });

    // Flag the extracted document as analyzed.
    await supabase
      .from("case_documents")
      .update({ analysis_status: "analyzed" })
      .eq("id", invoiceDoc.id);
  }

  // Recompute completeness deterministically on the merged snapshot.
  const completeness = computeCompleteness({
    debtor_name: merged.debtor_name,
    debtor_email: merged.debtor_email,
    debtor_accounting_email: merged.debtor_accounting_email,
    invoice_number: merged.invoice_number,
    invoice_date: merged.invoice_date,
    due_date: merged.due_date,
    original_amount: merged.original_amount,
    amount_ht: merged.amount_ht,
    service_description: merged.service_description,
    payee_name: merged.payee_name,
    iban: merged.iban,
    documentCount: documents.length,
    hasInvoiceDocument: documents.some((d) => d.document_category === "invoice"),
  });

  const summary = await summarizeCase({ ...merged, remaining_amount: merged.remaining_amount });
  await supabase.from("ai_classifications").insert({
    case_id: caseId,
    kind: "case_summary",
    result: { summary },
    confidence: 1,
    model: isOpenAIConfigured ? env.OPENAI_MODEL : "heuristic",
    prompt_version: PROMPT_VERSION_SUMMARY,
  });

  // Deterministic next status.
  const lowConfidence = invoiceDoc ? extractionConfidence < 0.6 : false;
  let nextStatus: CaseStatus = "under_analysis";
  if (completeness.blockers.length === 0) {
    nextStatus = "ready_to_contact";
  } else {
    nextStatus = "missing_information";
  }
  // Never emit a forbidden transition.
  const fromStatus: CaseStatus =
    row.status === "draft" || row.status === "missing_information"
      ? "under_analysis"
      : row.status;
  const applyStatus = canTransition(fromStatus, nextStatus)
    ? nextStatus
    : fromStatus;

  const { error: updErr } = await supabase
    .from("cases")
    .update({
      invoice_number: merged.invoice_number,
      invoice_date: merged.invoice_date,
      due_date: merged.due_date,
      amount_ht: merged.amount_ht,
      vat_amount: merged.vat_amount,
      original_amount: merged.original_amount,
      remaining_amount: merged.remaining_amount ?? merged.original_amount,
      debtor_name: merged.debtor_name,
      completeness_score: completeness.score,
      ai_summary: summary,
      status: applyStatus,
      human_review_required: lowConfidence,
    })
    .eq("id", caseId);
  if (updErr) return { error: updErr.message };

  await supabase.from("case_timeline").insert({
    case_id: caseId,
    event_type: "analysis_completed",
    title: "Analyse terminée",
    description:
      applyStatus === "ready_to_contact"
        ? "Dossier complet, prêt à contacter l'organisme."
        : `Dossier analysé — éléments manquants : ${completeness.blockers
            .map((b) => b.label)
            .join(", ")}.`,
    old_status: "under_analysis",
    new_status: applyStatus,
    source: "ai",
    metadata: { completeness: completeness.score, confidence: extractionConfidence },
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    case_id: caseId,
    action: "case_analyzed",
    source: "ai",
    metadata: { completeness: completeness.score, status: applyStatus },
  });

  return { status: applyStatus, completeness: completeness.score };
}
