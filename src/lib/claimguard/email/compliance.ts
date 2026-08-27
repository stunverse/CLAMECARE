/**
 * Outbound compliance guard (cahier des charges §14/§40 + positioning rules).
 *
 * MyDueGuard does amicable recovery FOR the freelancer — it is never a
 * commissaire de justice (huissier) nor a coercive collector. Its emails to the
 * debtor must never threaten seizure, invoke enforcement powers, or usurp the
 * attributes of a public officer. This deterministic check runs before ANY
 * outbound send (template, AI-drafted, or manually typed) and blocks content
 * that crosses that line, so an AI slip or a human mistake cannot go out.
 */

export interface ComplianceViolation {
  term: string;
  reason: string;
}

export interface ComplianceResult {
  ok: boolean;
  violations: ComplianceViolation[];
}

interface Rule {
  pattern: RegExp;
  term: string;
  reason: string;
}

/**
 * Forbidden phrasings. Tuned to catch COERCIVE language while avoiding false
 * positives on legitimate amicable wording. Note we intentionally do NOT ban
 * "saisir le tribunal" (referring a matter to court is legitimate) — only asset
 * seizure and enforcement claims.
 */
const RULES: Rule[] = [
  { pattern: /\bhuissier(?:s)?\b/i, term: "huissier", reason: "MyDueGuard n'est pas huissier / commissaire de justice." },
  { pattern: /\bcommissaire(?:s)? de justice\b/i, term: "commissaire de justice", reason: "Ne pas invoquer un officier ministériel dans une relance amiable." },
  { pattern: /\bsaisie(?:s)?\b/i, term: "saisie", reason: "Menace d'exécution forcée — acte réservé au commissaire de justice." },
  { pattern: /\bsaisir\s+(?:vos|ses|les)\s+(?:comptes?|biens?|salaires?|avoirs?)\b/i, term: "saisir vos comptes/biens", reason: "Menace de saisie." },
  { pattern: /\bsommation(?:s)?\b/i, term: "sommation", reason: "Terme d'acte d'huissier." },
  { pattern: /au\s+nom\s+de\s+la\s+loi/i, term: "au nom de la loi", reason: "Usurpation d'autorité publique." },
  { pattern: /recouvrement\s+forc[ée]/i, term: "recouvrement forcé", reason: "MyDueGuard fait du recouvrement amiable, pas forcé." },
  { pattern: /ex[ée]cution\s+forc[ée]e/i, term: "exécution forcée", reason: "Acte réservé au commissaire de justice." },
  { pattern: /nous\s+(?:engageons|engagerons|lançons|lancerons|entamons|entamerons)\s+(?:une\s+)?(?:proc[ée]dure|poursuites?|action\s+en\s+justice)/i, term: "nous engageons une procédure", reason: "MyDueGuard ne lance aucune procédure : c'est au créancier de décider." },
  { pattern: /avant\s+saisie/i, term: "avant saisie", reason: "Menace de saisie." },
  { pattern: /\bmise\s+en\s+demeure\s+d['’]huissier\b/i, term: "mise en demeure d'huissier", reason: "Ne pas se présenter comme huissier." },
  { pattern: /\bsomm(?:ons|é|er)\b/i, term: "sommer", reason: "Vocabulaire d'acte d'huissier." },
];

/**
 * Check outbound email content (subject + body). Returns ok:false with the list
 * of violations when coercive/impersonating language is detected.
 */
export function checkOutboundCompliance(
  subject: string,
  body: string,
): ComplianceResult {
  const text = `${subject ?? ""}\n${body ?? ""}`;
  const violations: ComplianceViolation[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      violations.push({ term: rule.term, reason: rule.reason });
    }
  }
  return { ok: violations.length === 0, violations };
}
