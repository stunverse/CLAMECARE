import type { Case } from "@/lib/claimguard/types";

/**
 * Deterministic completeness scoring (cahier des charges §12/§62-1).
 *
 * The score drives whether a case is exploitable enough to start contacting
 * the organisme. It is NOT produced by AI — the AI only extracts fields; the
 * score is a pure function of which structured fields are present so it is
 * stable, auditable and testable.
 */

export interface CompletenessField {
  key: string;
  label: string;
  weight: number;
  present: boolean;
  /** True when this field is required before the workflow may contact anyone. */
  blocking?: boolean;
}

export interface CompletenessResult {
  score: number; // 0..100
  fields: CompletenessField[];
  missing: CompletenessField[];
  /** Blocking fields still missing — the case cannot be contacted without them. */
  blockers: CompletenessField[];
}

/** A case is a plain object with (possibly) partially-filled fields. */
export type CasePartial = Partial<
  Pick<
    Case,
    | "debtor_name"
    | "debtor_email"
    | "debtor_accounting_email"
    | "invoice_number"
    | "invoice_date"
    | "due_date"
    | "original_amount"
    | "amount_ht"
    | "service_description"
    | "payee_name"
    | "iban"
  >
> & { documentCount?: number; hasInvoiceDocument?: boolean };

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return !Number.isNaN(v);
  return Boolean(v);
}

/**
 * Compute the completeness score. Weights sum to 100. A field is "present"
 * when the corresponding structured value is filled. `documentCount` /
 * `hasInvoiceDocument` let the caller factor in uploaded evidence.
 */
export function computeCompleteness(input: CasePartial): CompletenessResult {
  const fields: CompletenessField[] = [
    {
      key: "debtor",
      label: "Organisme débiteur",
      weight: 15,
      blocking: true,
      present: filled(input.debtor_name),
    },
    {
      key: "debtor_email",
      label: "Email de contact / comptabilité",
      weight: 15,
      blocking: true,
      present: filled(input.debtor_email) || filled(input.debtor_accounting_email),
    },
    {
      key: "invoice_number",
      label: "Numéro de facture",
      weight: 10,
      blocking: true,
      present: filled(input.invoice_number),
    },
    {
      key: "invoice_date",
      label: "Date de facture",
      weight: 8,
      present: filled(input.invoice_date),
    },
    {
      key: "due_date",
      label: "Date d'échéance",
      weight: 12,
      blocking: true,
      present: filled(input.due_date),
    },
    {
      key: "amount",
      label: "Montant dû (TTC)",
      weight: 15,
      blocking: true,
      present: filled(input.original_amount) || filled(input.amount_ht),
    },
    {
      key: "service",
      label: "Prestation concernée",
      weight: 5,
      present: filled(input.service_description),
    },
    {
      key: "payee",
      label: "Coordonnées de paiement (IBAN)",
      weight: 10,
      blocking: true,
      present: filled(input.iban) && filled(input.payee_name),
    },
    {
      key: "invoice_document",
      label: "Facture jointe",
      weight: 10,
      blocking: true,
      present: input.hasInvoiceDocument ?? (input.documentCount ?? 0) > 0,
    },
  ];

  const score = Math.round(
    fields.reduce((sum, f) => sum + (f.present ? f.weight : 0), 0),
  );
  const missing = fields.filter((f) => !f.present);
  const blockers = missing.filter((f) => f.blocking);

  return { score, fields, missing, blockers };
}
