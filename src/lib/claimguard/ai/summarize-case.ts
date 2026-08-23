import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import { CLAIMGUARD_SAFETY, dataBlock } from "@/lib/claimguard/ai/safety";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import { daysUntil } from "@/lib/format";
import type { Case } from "@/lib/claimguard/types";

export const PROMPT_VERSION_SUMMARY = "summarize_case.v1";

/** Deterministic, always-true one-liner built only from stored facts. */
export function heuristicSummary(c: Partial<Case>): string {
  const parts: string[] = [];
  const amount = c.remaining_amount ?? c.original_amount ?? null;
  if (amount !== null) parts.push(`Facture de ${formatEuro(amount)}`);
  if (c.debtor_name) parts.push(`due par ${c.debtor_name}`);
  if (c.due_date) {
    const days = daysUntil(c.due_date);
    if (days !== null && days < 0) {
      parts.push(`échue depuis le ${formatDateFr(c.due_date)} (${Math.abs(days)} j de retard)`);
    } else {
      parts.push(`échéance le ${formatDateFr(c.due_date)}`);
    }
  }
  const base = parts.length ? parts.join(" ") + "." : "Dossier en cours de constitution.";
  return base;
}

/**
 * Produce a short factual case summary. The LLM only rephrases the structured
 * facts we give it (it receives no free text it could hallucinate from); on any
 * failure we return the deterministic summary.
 */
export async function summarizeCase(c: Partial<Case>): Promise<string> {
  const heuristic = heuristicSummary(c);
  if (!isOpenAIConfigured) return heuristic;

  try {
    const facts = JSON.stringify(
      {
        organisme: c.debtor_name,
        numero_facture: c.invoice_number,
        montant_du: c.remaining_amount ?? c.original_amount,
        date_facture: c.invoice_date,
        echeance: c.due_date,
        statut: c.status,
        relances_envoyees: c.reminder_count,
        prestation: c.service_description,
      },
      null,
      0,
    );

    const user = [
      "Rédige un résumé factuel de 1 à 2 phrases du dossier, en français, à partir UNIQUEMENT des faits fournis. N'ajoute aucun fait, chiffre ou date qui n'y figure pas.",
      "",
      dataBlock("FAITS_DU_DOSSIER", facts),
      "",
      'Renvoie UNIQUEMENT ce JSON : {"summary": string}',
    ].join("\n");

    const raw = await generateJSON({
      system: CLAIMGUARD_SAFETY,
      user,
      temperature: 0.2,
    });
    const p = JSON.parse(raw) as { summary?: unknown };
    return typeof p.summary === "string" && p.summary.trim()
      ? p.summary.trim()
      : heuristic;
  } catch {
    return heuristic;
  }
}
