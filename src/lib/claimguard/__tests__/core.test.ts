import { describe, it, expect } from "vitest";
import {
  canTransition,
  isTerminal,
  ALLOWED_TRANSITIONS,
} from "@/lib/claimguard/state-machine";
import { computeCompleteness } from "@/lib/cases/completeness";
import {
  clampToBusinessWindow,
  nextReminderAt,
  addDays,
  DEFAULT_REMINDERS,
} from "@/lib/claimguard/workflow/schedule";
import { parseCaseReference, caseReplyAddress } from "@/lib/claimguard/email/addressing";
import { heuristicClassify } from "@/lib/claimguard/ai/classify-email";
import { heuristicExtract } from "@/lib/claimguard/ai/extract-invoice";
import { kindForReminder, renderCaseEmail } from "@/lib/claimguard/email/templates";
import { computeDunning, DEFAULT_DUNNING } from "@/lib/claimguard/legal/penalties";
import { checkOutboundCompliance } from "@/lib/claimguard/email/compliance";

/* --------------------------- state machine (§9) --------------------------- */
describe("state machine", () => {
  it("allows the happy path draft → ready → contacted → paid → closed", () => {
    expect(canTransition("draft", "under_analysis")).toBe(true);
    expect(canTransition("under_analysis", "ready_to_contact")).toBe(true);
    expect(canTransition("ready_to_contact", "first_contact_sent")).toBe(true);
    expect(canTransition("first_contact_sent", "waiting_for_organization")).toBe(true);
    expect(canTransition("waiting_for_organization", "payment_promised")).toBe(true);
    expect(canTransition("payment_promised", "paid")).toBe(true);
    expect(canTransition("paid", "closed")).toBe(true);
  });

  it("forbids illegal jumps", () => {
    expect(canTransition("draft", "paid")).toBe(false);
    expect(canTransition("ready_to_contact", "closed")).toBe(false);
    expect(canTransition("closed", "waiting_for_organization")).toBe(false);
  });

  it("treats closed/cancelled as terminal", () => {
    expect(isTerminal("closed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("waiting_for_organization")).toBe(false);
    expect(ALLOWED_TRANSITIONS.closed).toEqual([]);
  });
});

/* --------------------------- completeness (§7/§12) ------------------------ */
describe("completeness score", () => {
  it("scores a full dossier at 100 with no blockers", () => {
    const r = computeCompleteness({
      debtor_name: "OF Test",
      debtor_email: "compta@of.fr",
      invoice_number: "F-1",
      invoice_date: "2026-06-01",
      due_date: "2026-07-01",
      original_amount: 1200,
      service_description: "Formation",
      payee_name: "Camille",
      iban: "FR7612345",
      hasInvoiceDocument: true,
    });
    expect(r.score).toBe(100);
    expect(r.blockers).toHaveLength(0);
  });

  it("flags blocking fields when empty", () => {
    const r = computeCompleteness({ documentCount: 0 });
    expect(r.score).toBe(0);
    expect(r.blockers.length).toBeGreaterThan(0);
    expect(r.blockers.some((b) => b.key === "due_date")).toBe(true);
  });
});

/* ---------------------------- scheduling (§15) ---------------------------- */
describe("business-window scheduling", () => {
  it("pushes a Saturday morning to Monday 09:00 UTC", () => {
    const sat = new Date("2026-08-22T07:00:00Z"); // Saturday
    const out = clampToBusinessWindow(sat, DEFAULT_REMINDERS);
    expect(out.toISOString()).toBe("2026-08-24T09:00:00.000Z");
  });

  it("pushes after-hours Friday to Monday 09:00 UTC", () => {
    const fri = new Date("2026-08-21T20:00:00Z");
    const out = clampToBusinessWindow(fri, DEFAULT_REMINDERS);
    expect(out.toISOString()).toBe("2026-08-24T09:00:00.000Z");
  });

  it("keeps an in-window weekday moment unchanged", () => {
    const wed = new Date("2026-08-19T10:00:00Z");
    expect(clampToBusinessWindow(wed, DEFAULT_REMINDERS).toISOString()).toBe(
      "2026-08-19T10:00:00.000Z",
    );
  });

  it("returns null past the configured reminder schedule", () => {
    const base = new Date("2026-08-19T09:00:00Z");
    expect(nextReminderAt(base, 0, DEFAULT_REMINDERS)).not.toBeNull();
    expect(nextReminderAt(base, 99, DEFAULT_REMINDERS)).toBeNull();
  });

  it("addDays is pure and UTC-stable", () => {
    expect(addDays(new Date("2026-08-19T09:00:00Z"), 3).toISOString()).toBe(
      "2026-08-22T09:00:00.000Z",
    );
  });
});

/* --------------------------- email addressing (§36) ----------------------- */
describe("case reference routing", () => {
  it("extracts the reference from a +tag recipient", () => {
    expect(
      parseCaseReference("case+CG-2026-000482@claimguard.fr"),
    ).toBe("CG-2026-000482");
  });

  it("falls back to a bare reference in the subject", () => {
    expect(parseCaseReference(null, "Re: dossier CG-2026-000123")).toBe(
      "CG-2026-000123",
    );
  });

  it("returns null when nothing matches", () => {
    expect(parseCaseReference("hello@example.com", "no ref here")).toBeNull();
  });

  it("builds a reply address only when a domain is configured", () => {
    // INBOUND_EMAIL_DOMAIN is unset in tests → null.
    expect(caseReplyAddress("CG-2026-000001")).toBeNull();
  });
});

/* --------------------- email classification (§12/§16) --------------------- */
describe("inbound classification (heuristic, offline)", () => {
  it("detects a given payment date and extracts it", () => {
    const r = heuristicClassify(
      "Re: facture",
      "Bonjour, nous réglerons la facture le 10/09/2026. Cordialement",
    );
    expect(r.category).toBe("payment_date_given");
    expect(r.promise?.promised_date).toBe("2026-09-10");
  });

  it("detects a dispute", () => {
    const r = heuristicClassify("Contestation", "Nous contestons ce montant.");
    expect(r.category).toBe("dispute");
  });

  it("returns unknown with low confidence on ambiguous text", () => {
    const r = heuristicClassify("", "ok merci");
    expect(r.category).toBe("unknown");
    expect(r.confidence).toBeLessThan(0.5);
  });
});

/* ----------------------- invoice extraction (§8/§27) ---------------------- */
describe("invoice extraction (heuristic) never invents", () => {
  it("extracts fields that are present", () => {
    const text = [
      "Facture n° F-2026-051",
      "Date facture: 14/07/2026",
      "Échéance: 14/08/2026",
      "Total HT: 1 250,00 €",
      "TVA 20%: 250,00 €",
      "Total TTC: 1 500,00 €",
    ].join("\n");
    const r = heuristicExtract(text);
    expect(r.fields.invoice_number).toBe("F-2026-051");
    expect(r.fields.due_date).toBe("2026-08-14");
    expect(r.fields.total_ttc).toBe(1500);
    expect(r.fields.amount_ht).toBe(1250);
  });

  it("returns nulls (not guesses) for an empty document", () => {
    const r = heuristicExtract("");
    expect(r.fields.total_ttc).toBeNull();
    expect(r.fields.invoice_number).toBeNull();
    expect(r.confidence).toBe(0);
  });
});

/* --------------------------- reminder template kind ----------------------- */
describe("reminder kind", () => {
  it("maps reminder count to template kind", () => {
    expect(kindForReminder(0)).toBe("first_contact");
    expect(kindForReminder(1)).toBe("reminder");
    expect(kindForReminder(3)).toBe("final_notice");
  });
});

/* ------------------------- dunning / penalties (§34) ---------------------- */
describe("dunning arithmetic", () => {
  it("adds late penalties + €40 indemnity once overdue, separate from principal", () => {
    const d = computeDunning(3000, "2026-07-15", "2026-09-15", DEFAULT_DUNNING);
    expect(d.principal).toBe(3000);
    expect(d.daysOverdue).toBe(62);
    // 3000 * 0.12 * 62/365 = 61.15
    expect(d.penalties).toBeCloseTo(61.15, 2);
    expect(d.fixedIndemnity).toBe(40);
    expect(d.total).toBeCloseTo(3101.15, 2);
  });

  it("charges nothing extra before the due date", () => {
    const d = computeDunning(1000, "2026-12-31", "2026-09-15", DEFAULT_DUNNING);
    expect(d.daysOverdue).toBe(0);
    expect(d.penalties).toBe(0);
    expect(d.fixedIndemnity).toBe(0);
    expect(d.total).toBe(1000);
  });
});

/* ----------------------- outbound compliance guard (§14) ------------------ */
describe("compliance guard", () => {
  it("blocks coercive / impersonating wording", () => {
    expect(checkOutboundCompliance("", "Nous mandatons un huissier.").ok).toBe(false);
    expect(
      checkOutboundCompliance("", "Dernier avertissement avant saisie de vos comptes.").ok,
    ).toBe(false);
    expect(
      checkOutboundCompliance("", "Sans règlement, nous engageons une procédure judiciaire.").ok,
    ).toBe(false);
    expect(checkOutboundCompliance("Sommation de payer", "…").ok).toBe(false);
  });

  it("passes a legitimate amicable message", () => {
    const clean =
      "Bonjour, sauf erreur la facture demeure impayée. Pourriez-vous m'indiquer la date de règlement prévue ? Cordialement.";
    expect(checkOutboundCompliance("Relance", clean).ok).toBe(true);
  });

  it("the amicable formal notice template is itself compliant", () => {
    const dunning = computeDunning(3000, "2026-07-15", "2026-09-15");
    const email = renderCaseEmail(
      "formal_notice",
      {
        payee_name: "Camille Freelance",
        debtor_name: "Studio Nova SAS",
        invoice_number: "F-2026-0117",
        remaining_amount: 3000,
        due_date: "2026-07-15",
        iban: "FR7612345",
      },
      { dunning },
    );
    expect(email.body).toContain("mandataire");
    expect(email.body).toContain("Indemnité forfaitaire");
    expect(checkOutboundCompliance(email.subject, email.body).ok).toBe(true);
  });
});
