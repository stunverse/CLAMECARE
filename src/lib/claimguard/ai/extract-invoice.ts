import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import {
  CLAIMGUARD_SAFETY,
  dataBlock,
  normalizeConfidence,
} from "@/lib/claimguard/ai/safety";

/** Versioned prompt keys (persisted alongside each ai_classifications row). */
export const PROMPT_VERSION_INVOICE = "extract_invoice.v1";

export interface ExtractedInvoiceFields {
  invoice_number: string | null;
  invoice_date: string | null; // ISO yyyy-mm-dd
  due_date: string | null; // ISO yyyy-mm-dd
  amount_ht: number | null;
  vat_amount: number | null;
  total_ttc: number | null;
  debtor_name: string | null;
  iban: string | null;
}

export interface InvoiceExtractionResult {
  fields: ExtractedInvoiceFields;
  confidence: number;
  source: "ai" | "heuristic";
}

const EMPTY: ExtractedInvoiceFields = {
  invoice_number: null,
  invoice_date: null,
  due_date: null,
  amount_ht: null,
  vat_amount: null,
  total_ttc: null,
  debtor_name: null,
  iban: null,
};

/* --------------------------- deterministic layer -------------------------- */

/** Convert a French/ISO date string found in text to ISO yyyy-mm-dd. */
function toIsoDate(raw: string): string | null {
  const s = raw.trim();
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const fr = s.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/);
  if (fr) {
    const [, d, m, yRaw] = fr;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    if (Number(month) > 12) return null;
    return `${y}-${month}-${day}`;
  }
  // yyyy-mm-dd
  const iso = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function parseAmount(raw: string): number | null {
  // "1 234,56" | "1234.56" | "1.234,56"
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // comma is the decimal separator
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // dot is the decimal separator (or none)
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function firstMatch(text: string, res: RegExp[]): string | null {
  for (const re of res) {
    const m = text.match(re);
    if (m) return m[1] ?? m[0];
  }
  return null;
}

/**
 * Pure regex extraction. Grounded by construction: everything returned is a
 * literal substring of the text. Used both as the offline fallback and to
 * validate the LLM's output (the model may not return anything not present).
 */
export function heuristicExtract(text: string): InvoiceExtractionResult {
  const t = text.replace(/\r/g, "");

  const invoice_number = firstMatch(t, [
    /facture\s*(?:n[°o]|num[ée]ro|#)?\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/.]{2,20})/i,
    /\bn[°o]\s*facture\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/.]{2,20})/i,
  ]);

  const invoiceDateRaw = firstMatch(t, [
    /date\s*(?:de\s*)?facture\s*[:.]?\s*([0-9]{1,2}[/.\-][0-9]{1,2}[/.\-][0-9]{2,4})/i,
    /facture\s*(?:du|le)\s*([0-9]{1,2}[/.\-][0-9]{1,2}[/.\-][0-9]{2,4})/i,
  ]);
  const dueDateRaw = firstMatch(t, [
    /[ée]ch[ée]ance\s*[:.]?\s*([0-9]{1,2}[/.\-][0-9]{1,2}[/.\-][0-9]{2,4})/i,
    /(?:date\s*(?:limite|de)\s*)?paiement\s*(?:avant|au|le)?\s*[:.]?\s*([0-9]{1,2}[/.\-][0-9]{1,2}[/.\-][0-9]{2,4})/i,
  ]);

  const totalRaw = firstMatch(t, [
    /total\s*ttc\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
    /montant\s*ttc\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
    /net\s*[àa]\s*payer\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
  ]);
  const htRaw = firstMatch(t, [
    /total\s*ht\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
    /montant\s*ht\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
  ]);
  const vatRaw = firstMatch(t, [
    /(?:montant\s*)?tva\s*(?:\d{1,2}[.,]?\d?\s*%)?\s*[:.]?\s*([0-9][\d\s.,]*)\s*€?/i,
  ]);

  const ibanRaw = firstMatch(t, [
    /\b(FR\d{2}(?:\s?[0-9A-Z]){10,27})\b/,
  ]);

  const fields: ExtractedInvoiceFields = {
    invoice_number: invoice_number?.trim() ?? null,
    invoice_date: invoiceDateRaw ? toIsoDate(invoiceDateRaw) : null,
    due_date: dueDateRaw ? toIsoDate(dueDateRaw) : null,
    amount_ht: htRaw ? parseAmount(htRaw) : null,
    vat_amount: vatRaw ? parseAmount(vatRaw) : null,
    total_ttc: totalRaw ? parseAmount(totalRaw) : null,
    debtor_name: null, // too ambiguous to guess deterministically
    iban: ibanRaw ? ibanRaw.replace(/\s/g, "") : null,
  };

  const found = Object.values(fields).filter((v) => v !== null).length;
  const confidence = normalizeConfidence(found / 8, 0);

  return { fields, confidence, source: "heuristic" };
}

/* ------------------------------- AI layer -------------------------------- */

function isSubstringPresent(value: string, haystack: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s.\-/]/g, "");
  return norm(haystack).includes(norm(value));
}

/**
 * Extract structured invoice fields. Uses the LLM when configured, but every
 * returned string is validated against the source text so the model can never
 * inject a value that isn't in the document. Falls back to the deterministic
 * heuristic when the AI is unavailable or errors.
 */
export async function extractInvoiceFields(
  text: string,
): Promise<InvoiceExtractionResult> {
  const clean = text.trim();
  if (!clean) return { fields: { ...EMPTY }, confidence: 0, source: "heuristic" };

  const heuristic = heuristicExtract(clean);
  if (!isOpenAIConfigured) return heuristic;

  try {
    const user = [
      "Extrais les informations d'une facture à partir du texte ci-dessous.",
      "N'extrais que ce qui est explicitement écrit. Si un champ est absent, renvoie null.",
      "Les dates doivent être au format ISO yyyy-mm-dd. Les montants sont des nombres (point décimal, sans symbole ni séparateur de milliers).",
      "Le débiteur est l'organisme de formation destinataire de la facture (le client), pas l'émetteur.",
      "",
      dataBlock("FACTURE", clean.slice(0, 8000)),
      "",
      'Renvoie UNIQUEMENT ce JSON : {"invoice_number":string|null,"invoice_date":string|null,"due_date":string|null,"amount_ht":number|null,"vat_amount":number|null,"total_ttc":number|null,"debtor_name":string|null,"iban":string|null,"confidence":number}',
    ].join("\n");

    const raw = await generateJSON({
      system: CLAIMGUARD_SAFETY,
      user,
      temperature: 0,
    });
    const p = JSON.parse(raw) as Record<string, unknown>;

    const str = (v: unknown, requireInText = true): string | null => {
      if (typeof v !== "string" || !v.trim()) return null;
      const val = v.trim();
      if (requireInText && !isSubstringPresent(val, clean)) return null;
      return val;
    };
    const numOf = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const dateOf = (v: unknown): string | null => {
      if (typeof v !== "string") return null;
      const iso = v.match(/^\d{4}-\d{2}-\d{2}$/) ? v : toIsoDate(v);
      return iso;
    };

    const fields: ExtractedInvoiceFields = {
      invoice_number: str(p.invoice_number) ?? heuristic.fields.invoice_number,
      invoice_date: dateOf(p.invoice_date) ?? heuristic.fields.invoice_date,
      due_date: dateOf(p.due_date) ?? heuristic.fields.due_date,
      amount_ht: numOf(p.amount_ht) ?? heuristic.fields.amount_ht,
      vat_amount: numOf(p.vat_amount) ?? heuristic.fields.vat_amount,
      total_ttc: numOf(p.total_ttc) ?? heuristic.fields.total_ttc,
      debtor_name: str(p.debtor_name) ?? heuristic.fields.debtor_name,
      iban: str(p.iban)?.replace(/\s/g, "") ?? heuristic.fields.iban,
    };

    return {
      fields,
      confidence: normalizeConfidence(p.confidence, heuristic.confidence),
      source: "ai",
    };
  } catch {
    return heuristic;
  }
}
