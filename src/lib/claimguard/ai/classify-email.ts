import { isOpenAIConfigured } from "@/lib/env";
import { generateJSON } from "@/lib/ai/provider";
import {
  CLAIMGUARD_SAFETY,
  dataBlock,
  normalizeConfidence,
} from "@/lib/claimguard/ai/safety";
import {
  EMAIL_CATEGORIES,
  type EmailCategory,
} from "@/lib/claimguard/enums";

export const PROMPT_VERSION_CLASSIFY = "classify_email.v1";

export interface ExtractedPromise {
  promised_date: string | null; // ISO yyyy-mm-dd
  amount: number | null;
}

export interface EmailClassification {
  category: EmailCategory;
  confidence: number;
  summary: string;
  promise: ExtractedPromise | null;
  source: "ai" | "heuristic";
}

/* --------------------------- deterministic layer -------------------------- */

const KEYWORDS: { category: EmailCategory; res: RegExp[] }[] = [
  { category: "payment_confirmed", res: [/\bvir(ement)?\s+(effectu|émis|réalis)/i, /\bpay(é|ée|ement)\s+(effectu|réalis)/i, /\bréglé/i, /\bmis en paiement/i] },
  {
    category: "payment_date_given",
    res: [
      /\bpaiement\s+(le|au|pour le|avant le)\s+\d/i,
      /\béchéance\s+de paiement/i,
      /\bsera (payé|réglé)/i,
      // Conjugated payment verbs (réglerons, paierons, verserons…) + a date.
      /\b(r[éèe]gl|pai|vers)\w*\b[^.]*\b(le|au|avant le|pour le|d'ici le)\s+\d{1,2}[/.\-]\d/i,
    ],
  },
  { category: "invoice_not_received", res: [/\bpas re[çc]u.*facture/i, /\bfacture\s+non re[çc]ue/i, /\bnous n'avons pas.*facture/i] },
  { category: "invoice_rejected", res: [/\bfacture\s+rejet/i, /\brefus.*facture/i] },
  { category: "wrong_invoice", res: [/\berreur.*facture/i, /\bfacture\s+(erron|incorrect)/i, /\bmontant.*incorrect/i] },
  { category: "purchase_order_missing", res: [/\bbon de commande/i, /\bnum[ée]ro de commande/i, /\bPO\b/] },
  { category: "document_missing", res: [/\battestation/i, /\bfeuille d'[ée]margement/i, /\bpi[èe]ce.*manquante/i, /\bjustificatif/i] },
  { category: "waiting_internal_approval", res: [/\bvalidation\s+interne/i, /\ben attente.*validation/i, /\bsignature du responsable/i] },
  { category: "accounting_processing", res: [/\bcomptabilit[ée].*(traite|cours)/i, /\ben cours de traitement/i, /\bservice comptable/i] },
  { category: "dispute", res: [/\bcontest/i, /\blitige/i, /\bnous contestons/i, /\bd[ée]saccord/i] },
  { category: "out_of_office", res: [/\babsent.*bureau/i, /\bde retour le/i, /\bout of office/i, /\bcong[ée]s/i] },
  { category: "request_information", res: [/\bpourriez-vous.*pr[ée]ciser/i, /\bmerci de.*transmettre/i, /\bpouvez-vous nous/i] },
];

const MONTHS: Record<string, string> = {
  janvier: "01", février: "02", fevrier: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08", aout: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12", decembre: "12",
};

/**
 * Resolve a day+month (no year) to the nearest FUTURE ISO date — deterministic
 * given `now`. A client who says "le 15 septembre" means the next 15 September.
 */
function isoWithInferredYear(
  day: number,
  month: number,
  now = new Date(),
): string {
  const y = now.getUTCFullYear();
  const candidate = Date.UTC(y, month - 1, day);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const year = candidate < today ? y + 1 : y;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractPromiseDate(text: string): string | null {
  // Numeric dd/mm(/yyyy) — year optional (inferred when absent).
  const numeric = text.match(
    /\b(?:le|au|avant le|pour le|d'ici(?: le)?|d'ici)\s+(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?/i,
  );
  if (numeric) {
    const [, dStr, mStr, yRaw] = numeric;
    const d = Number(dStr);
    const m = Number(mStr);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      if (yRaw) {
        const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      return isoWithInferredYear(d, m);
    }
  }
  // Worded "(le) 15 septembre (2026)" — year optional (inferred when absent).
  const worded = text.match(
    /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?/i,
  );
  if (worded) {
    const [, dStr, mName, y] = worded;
    const m = MONTHS[mName.toLowerCase()];
    const d = Number(dStr);
    if (m && d >= 1 && d <= 31) {
      return y
        ? `${y}-${m}-${String(d).padStart(2, "0")}`
        : isoWithInferredYear(d, Number(m));
    }
  }
  return null;
}

/** Any wording that signals an intent to pay (used with a detected date). */
const PAYMENT_INTENT_RE =
  /\b(r[éèe]gl|pai|vers|virement|acquitt|mandat|paiement)\w*/i;

export function heuristicClassify(
  subject: string,
  body: string,
): EmailClassification {
  const text = `${subject}\n${body}`;
  let category: EmailCategory = "unknown";
  for (const { category: cat, res } of KEYWORDS) {
    if (res.some((re) => re.test(text))) {
      category = cat;
      break;
    }
  }

  // Fallback: an intent to pay together with a concrete date is a payment
  // announcement, even when phrased in words ("je vous règle le 15 septembre").
  const detectedDate = extractPromiseDate(text);
  if (
    (category === "unknown" || category === "accounting_processing") &&
    detectedDate &&
    PAYMENT_INTENT_RE.test(text)
  ) {
    category = "payment_date_given";
  }

  const promiseDate =
    category === "payment_date_given" ? detectedDate : null;
  const summary = body.replace(/\s+/g, " ").trim().slice(0, 200);

  // A detected payment date is high signal → 0.6 (clears the review threshold).
  const confidence =
    category === "unknown" ? 0.2 : promiseDate ? 0.6 : 0.55;

  return {
    category,
    confidence,
    summary,
    promise: promiseDate ? { promised_date: promiseDate, amount: null } : null,
    source: "heuristic",
  };
}

/* ------------------------------- AI layer -------------------------------- */

export async function classifyEmail(
  subject: string,
  body: string,
): Promise<EmailClassification> {
  const heuristic = heuristicClassify(subject, body);
  if (!isOpenAIConfigured || !body.trim()) return heuristic;

  try {
    const user = [
      "Classe la réponse d'un client (entreprise donneuse d'ordre) concernant une facture impayée.",
      `Catégories autorisées : ${EMAIL_CATEGORIES.join(", ")}.`,
      "Si l'email annonce une date de paiement précise, extrais-la (ISO yyyy-mm-dd) ; sinon promised_date=null. N'invente aucune date : elle doit figurer dans le texte.",
      "",
      dataBlock("EMAIL", `Objet: ${subject}\n\n${body}`.slice(0, 6000)),
      "",
      'Renvoie UNIQUEMENT ce JSON : {"category": une catégorie autorisée, "confidence": number, "summary": string, "promised_date": string|null, "promised_amount": number|null}',
    ].join("\n");

    const raw = await generateJSON({
      system: CLAIMGUARD_SAFETY,
      user,
      temperature: 0,
    });
    const p = JSON.parse(raw) as Record<string, unknown>;

    const category = EMAIL_CATEGORIES.includes(p.category as EmailCategory)
      ? (p.category as EmailCategory)
      : heuristic.category;

    // The promised date is derived DETERMINISTICALLY from the email text, never
    // taken from the model. This guarantees the AI can't invent a year that
    // isn't written ("20 septembre" → the nearest FUTURE 20 September), which is
    // the whole point of "the AI classifies, the code decides the facts".
    const promisedDate = extractPromiseDate(`${subject}\n${body}`);
    const amount =
      typeof p.promised_amount === "number" && Number.isFinite(p.promised_amount)
        ? p.promised_amount
        : null;

    return {
      category,
      confidence: normalizeConfidence(p.confidence, heuristic.confidence),
      summary:
        typeof p.summary === "string" && p.summary.trim()
          ? p.summary.trim()
          : heuristic.summary,
      promise:
        promisedDate || amount !== null
          ? { promised_date: promisedDate, amount }
          : heuristic.promise,
      source: "ai",
    };
  } catch {
    return heuristic;
  }
}
