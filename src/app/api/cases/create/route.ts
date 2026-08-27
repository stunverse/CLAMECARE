import { NextResponse } from "next/server";
import { parseCaseForm } from "@/lib/cases/form";
import { createCase } from "@/lib/cases/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Case creation via a plain Route Handler (more robust than a Server Action
 * against deployment skew). The form POSTs its FormData here; we reuse the same
 * deterministic createCase() logic and return JSON { caseId } or { error }.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const input = parseCaseForm(formData);
    if (!input.debtor_name) {
      return NextResponse.json(
        { error: "Indiquez au moins le nom du client / de l'entreprise." },
        { status: 400 },
      );
    }
    const result = await createCase(input);
    return NextResponse.json(result);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { error: err?.message ?? "Erreur lors de la création du dossier." },
      { status: 500 },
    );
  }
}
