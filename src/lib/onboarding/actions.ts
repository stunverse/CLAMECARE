"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * MyDueGuard client onboarding (cahier des charges §4).
 *
 * Captures the freelancer's professional profile + their own payment
 * coordinates (never MyDueGuard's) and records the intervention mandate, then
 * sends them to their dashboard. Branchable: a no-op redirect in demo mode.
 */

export interface OnboardingState {
  error?: string;
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  if (!supabase) redirect("/dossiers");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/onboarding");

  // The intervention mandate is required for MyDueGuard to act on the
  // freelancer's behalf (amicable recovery for third party).
  if (formData.get("accept_mandate") !== "on") {
    return {
      error:
        "Vous devez autoriser MyDueGuard à assurer le suivi amiable de vos factures pour continuer.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: str(formData, "first_name"),
      last_name: str(formData, "last_name"),
      business_name: str(formData, "business_name"),
      siret: str(formData, "siret"),
      professional_status: str(formData, "professional_status"),
      address: str(formData, "address"),
      payee_name: str(formData, "payee_name"),
      iban: str(formData, "iban"),
      bic: str(formData, "bic"),
      mandate_accepted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/dossiers");
}
