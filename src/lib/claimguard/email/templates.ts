import { formatEuro, formatDateFr } from "@/lib/cases/format";
import type { Case } from "@/lib/claimguard/types";

/**
 * Deterministic email templates (cahier des charges §16/§62-4).
 *
 * The wording is built ONLY from stored case facts — never invented. The AI
 * may later rephrase the tone, but the facts (amount, invoice number, due
 * date, IBAN) always come from these templates so nothing can be fabricated.
 */

export const TEMPLATE_VERSION = "case_email.v1";

export type CaseEmailKind = "first_contact" | "reminder" | "final_notice";

export interface RenderedEmail {
  subject: string;
  body: string; // plain text
}

function invoiceLine(c: Partial<Case>): string {
  const bits: string[] = [];
  if (c.invoice_number) bits.push(`facture n° ${c.invoice_number}`);
  const amount = c.remaining_amount ?? c.original_amount ?? null;
  if (amount !== null) bits.push(`d'un montant de ${formatEuro(amount)}`);
  if (c.due_date) bits.push(`échue le ${formatDateFr(c.due_date)}`);
  return bits.join(" ");
}

function paymentBlock(c: Partial<Case>): string {
  if (!c.iban) return "";
  const lines = ["", "Coordonnées de règlement :"];
  if (c.payee_name) lines.push(`Titulaire : ${c.payee_name}`);
  lines.push(`IBAN : ${c.iban}`);
  if (c.bic) lines.push(`BIC : ${c.bic}`);
  return lines.join("\n");
}

function greeting(c: Partial<Case>): string {
  return c.debtor_contact_name
    ? `Bonjour ${c.debtor_contact_name},`
    : "Bonjour,";
}

function signature(c: Partial<Case>): string {
  const who = c.payee_name ?? "Le prestataire";
  return `Cordialement,\n${who}\n\n— Message envoyé via ClaimGuard pour le compte de ${who}.`;
}

export function renderCaseEmail(
  kind: CaseEmailKind,
  c: Partial<Case>,
): RenderedEmail {
  const inv = invoiceLine(c);
  const service = c.service_description
    ? ` concernant la prestation « ${c.service_description} »`
    : "";
  const ref = c.case_reference ? ` (réf. ${c.case_reference})` : "";

  if (kind === "first_contact") {
    return {
      subject: `Règlement de la ${c.invoice_number ? `facture n° ${c.invoice_number}` : "facture"}${ref}`,
      body: [
        greeting(c),
        "",
        `Sauf erreur de notre part, la ${inv}${service} demeure impayée à ce jour.`,
        "",
        "Pourriez-vous m'indiquer la date de règlement prévue, ou me préciser s'il manque un élément (bon de commande, attestation, etc.) pour procéder au paiement ?",
        paymentBlock(c),
        "",
        "Je reste à votre disposition pour toute information complémentaire.",
        "",
        signature(c),
      ]
        .filter((l) => l !== undefined)
        .join("\n"),
    };
  }

  if (kind === "final_notice") {
    return {
      subject: `Dernier rappel — ${c.invoice_number ? `facture n° ${c.invoice_number}` : "facture"} impayée${ref}`,
      body: [
        greeting(c),
        "",
        `Malgré mes précédents messages, la ${inv}${service} reste impayée.`,
        "",
        "Je vous remercie de bien vouloir procéder au règlement sous les meilleurs délais et de me communiquer la date de paiement.",
        paymentBlock(c),
        "",
        signature(c),
      ].join("\n"),
    };
  }

  // reminder
  return {
    subject: `Relance — ${c.invoice_number ? `facture n° ${c.invoice_number}` : "facture"}${ref}`,
    body: [
      greeting(c),
      "",
      `Je me permets de revenir vers vous au sujet de la ${inv}${service}, toujours en attente de règlement.`,
      "",
      "Pourriez-vous m'indiquer la date de paiement prévue ?",
      paymentBlock(c),
      "",
      signature(c),
    ].join("\n"),
  };
}

/** Choose the template kind from the deterministic reminder count. */
export function kindForReminder(reminderCount: number): CaseEmailKind {
  if (reminderCount <= 0) return "first_contact";
  if (reminderCount >= 3) return "final_notice";
  return "reminder";
}
