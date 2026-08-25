"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type AuthState = { error?: string; success?: string };

const NOT_CONFIGURED =
  "L'authentification n'est pas encore connectée. Ajoutez vos clés Supabase pour activer la connexion.";

async function getOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? env.APP_URL;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Persist the legal consents accepted at signup (cahier des charges §34).
 * Uses the service-role client when available (works even before email
 * confirmation); otherwise falls back to the user's session client.
 */
async function recordSignupConsents(userId: string) {
  const db = createAdminClient() ?? (await createClient());
  if (!db) return;

  const now = new Date().toISOString();
  const consents = [
    {
      user_id: userId,
      consent_type: "terms_of_service" as const,
      consent_text: "Acceptation des Conditions d'utilisation de ClaimGuard.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "privacy_policy" as const,
      consent_text: "Acceptation de la Politique de confidentialité de ClaimGuard.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "legal_disclaimer" as const,
      consent_text:
        "A compris que ClaimGuard assure un suivi administratif amiable, n'encaisse jamais les paiements et n'est ni huissier ni cabinet juridique.",
      accepted_at: now,
    },
    {
      user_id: userId,
      consent_type: "sensitive_document_processing" as const,
      consent_text:
        "Consentement au traitement par ClaimGuard des documents déposés (factures, justificatifs) pour le suivi amiable des paiements.",
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

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const redirectTo = str(formData, "redirectTo") || "/dossiers";
  redirect(redirectTo);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const firstName = str(formData, "first_name");
  const lastName = str(formData, "last_name");
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const acceptedAll =
    formData.get("accept_terms") === "on" &&
    formData.get("accept_privacy") === "on" &&
    formData.get("accept_disclaimer") === "on";
  if (!acceptedAll) {
    return {
      error:
        "Vous devez accepter les Conditions, la Politique de confidentialité et les mentions pour continuer.",
    };
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };

  if (data.user) {
    await recordSignupConsents(data.user.id);
  }

  // No session => email confirmation is required before sign in.
  if (!data.session) {
    return {
      success:
        "Compte créé. Vérifiez votre email pour confirmer votre adresse, puis connectez-vous.",
    };
  }

  redirect("/onboarding");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const email = str(formData, "email");
  if (!email) return { error: "L'email est requis." };

  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/settings`,
  });
  if (error) return { error: error.message };

  return {
    success:
      "Si un compte existe pour cet email, un lien de réinitialisation vient de partir.",
  };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=not_configured");

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/dossiers` },
  });

  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Permanently delete the current user's account and all their data.
 * Requires the service-role client (admin.deleteUser cascades to profiles and
 * every user-owned row via ON DELETE CASCADE). Without it, we sign the user
 * out and surface a notice so deletion can be completed by support.
 */
export async function deleteAccount() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?error=delete_unavailable");
  }

  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  redirect("/");
}
