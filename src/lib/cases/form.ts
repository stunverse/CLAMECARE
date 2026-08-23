/**
 * Pure (non-server) helpers for parsing the case form. Kept out of the
 * "use server" module because a server-action file may only export async
 * functions.
 */

export interface CaseFormInput {
  // Debtor / organisme de formation
  debtor_name: string | null;
  debtor_email: string | null;
  debtor_accounting_email: string | null;
  debtor_contact_name: string | null;
  // Invoice
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_ht: number | null;
  vat_amount: number | null;
  original_amount: number | null;
  service_description: string | null;
  // Client payment coordinates (their own account)
  payee_name: string | null;
  iban: string | null;
  bic: string | null;
}

function clean(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function num(v: FormDataEntryValue | null): number | null {
  const s = clean(v);
  if (s === null) return null;
  // Accept both "1 234,56" (fr) and "1234.56"
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function parseCaseForm(formData: FormData): CaseFormInput {
  return {
    debtor_name: clean(formData.get("debtor_name")),
    debtor_email: clean(formData.get("debtor_email")),
    debtor_accounting_email: clean(formData.get("debtor_accounting_email")),
    debtor_contact_name: clean(formData.get("debtor_contact_name")),
    invoice_number: clean(formData.get("invoice_number")),
    invoice_date: clean(formData.get("invoice_date")),
    due_date: clean(formData.get("due_date")),
    amount_ht: num(formData.get("amount_ht")),
    vat_amount: num(formData.get("vat_amount")),
    original_amount: num(formData.get("original_amount")),
    service_description: clean(formData.get("service_description")),
    payee_name: clean(formData.get("payee_name")),
    iban: clean(formData.get("iban")),
    bic: clean(formData.get("bic")),
  };
}

/** Derive the TTC total when only HT + VAT were entered. */
export function deriveTotal(input: CaseFormInput): number | null {
  if (input.original_amount !== null) return input.original_amount;
  if (input.amount_ht !== null) {
    return input.amount_ht + (input.vat_amount ?? 0);
  }
  return null;
}
