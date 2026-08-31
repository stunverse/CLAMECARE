import { NextResponse } from "next/server";
import { finalizeCaseCreation } from "@/lib/cases/actions";

/**
 * Triggers the automated first contact after the creation wizard is finished
 * (invoice attached). Called by the case form on "Terminer".
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { caseId?: unknown };
  const caseId = typeof body.caseId === "string" ? body.caseId : null;
  if (!caseId) {
    return NextResponse.json({ error: "caseId manquant" }, { status: 400 });
  }
  const result = await finalizeCaseCreation(caseId);
  return NextResponse.json(result);
}
