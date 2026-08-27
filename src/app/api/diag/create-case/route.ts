import { NextResponse } from "next/server";
import { createCase } from "@/lib/cases/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic: run the REAL createCase() (organization upsert +
 * case/timeline/audit inserts) exactly as the form does, and return the result
 * or the thrown error. Visit while logged in. To be removed.
 */
export async function GET() {
  try {
    const result = await createCase({
      debtor_name: "DIAG Full Test",
      debtor_email: "diag@test.fr",
      debtor_accounting_email: null,
      debtor_contact_name: "Service compta",
      invoice_number: "F-DIAG-1",
      invoice_date: "2026-06-15",
      due_date: "2026-07-15",
      amount_ht: 2500,
      vat_amount: 500,
      original_amount: 3000,
      service_description: "Test de diagnostic",
      payee_name: "Moi",
      iban: "FR7612345678",
      bic: null,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      threw: true,
      message: err?.message ?? String(e),
      stack: (err?.stack ?? "").slice(0, 1200),
    });
  }
}
