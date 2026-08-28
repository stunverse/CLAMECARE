import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Persist the mandatory legal consents (cahier des charges §34):
 * Conditions d'utilisation, Politique de confidentialité, mentions légales
 * (rôle de MyDueGuard) et traitement des documents sensibles.
 *
 * Shared by the email signup flow and the onboarding flow (Google accounts,
 * which never see the signup checkboxes). Idempotent enough for our needs:
 * it stamps the profile timestamps and inserts one consent row per type.
 *
 * Uses the service-role client when available (works even before email
 * confirmation); otherwise falls back to the caller's session client.
 */
export async function recordUserConsents(userId: string): Promise<void> {
  const db = createAdminClient() ?? (await createClient());
  if (!db) return;

  const now = new Date().toISOString();
  const consents = [
    {
      user_id: userId,
      consent_type: "terms_of_service" as const,
      consent_text: "Acceptation des Conditions d'utilisation de MyDueGuard.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "privacy_policy" as const,
      consent_text:
        "Acceptation de la Politique de confidentialité de MyDueGuard.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "legal_disclaimer" as const,
      consent_text:
        "A compris que MyDueGuard assure un suivi administratif amiable, n'encaisse jamais les paiements et n'est ni huissier ni cabinet juridique.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "sensitive_document_processing" as const,
      consent_text:
        "Consentement au traitement par MyDueGuard des documents déposés (factures, justificatifs) pour le suivi amiable des paiements.",
      accepted_at: now,
    },
  ];

  await db.from("user_consents").insert(consents);
  await db
    .from("profiles")
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
      legal_disclaimer_accepted_at: now,
    })
    .eq("id", userId);
}
