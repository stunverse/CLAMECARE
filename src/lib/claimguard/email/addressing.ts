import { env } from "@/lib/env";

/**
 * Per-case reply addressing (cahier des charges §62-4).
 *
 * Outbound case emails set Reply-To to `case+CG-2026-000042@<domain>` so the
 * organisme's reply lands on the inbound webhook and can be routed back to the
 * exact case by its reference — deterministically, no AI involved.
 */

const REFERENCE_RE = /\bCG-\d{4}-\d{6}\b/;

/** Build the per-case reply address, or null if the inbound domain is unset. */
export function caseReplyAddress(caseReference: string): string | null {
  const domain = env.INBOUND_EMAIL_DOMAIN;
  if (!domain) return null;
  return `case+${caseReference}@${domain}`;
}

/**
 * Extract a case reference from an inbound recipient address or, failing that,
 * from the subject/body. Returns null when nothing matches.
 */
export function parseCaseReference(
  ...candidates: (string | null | undefined)[]
): string | null {
  // 1) Prefer the +tag of the recipient address: case+CG-2026-000042@domain
  for (const c of candidates) {
    if (!c) continue;
    const plus = c.match(/\+(?:case[-_]?)?(CG-\d{4}-\d{6})@/i);
    if (plus) return plus[1].toUpperCase();
  }
  // 2) Fall back to a bare reference anywhere in the provided strings.
  for (const c of candidates) {
    if (!c) continue;
    const bare = c.match(REFERENCE_RE);
    if (bare) return bare[0].toUpperCase();
  }
  return null;
}
