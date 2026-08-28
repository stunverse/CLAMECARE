import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { MyDueGuardOnboarding } from "@/components/onboarding/claimguard-onboarding";

export const metadata: Metadata = { title: "Bienvenue sur MyDueGuard" };

interface ProfileNames {
  first_name: string | null;
  last_name: string | null;
  terms_accepted_at: string | null;
}

export default async function OnboardingPage() {
  const supabase = await createClient();

  let firstName: string | undefined;
  let lastName: string | undefined;
  let needsConsent = false;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/onboarding");

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, terms_accepted_at")
      .eq("id", user.id)
      .maybeSingle<ProfileNames>();
    const meta = user.user_metadata ?? {};
    firstName =
      profile?.first_name ||
      (meta.first_name as string | undefined) ||
      (meta.given_name as string | undefined) ||
      (typeof meta.name === "string" ? meta.name.split(" ")[0] : undefined);
    lastName =
      profile?.last_name ||
      (meta.last_name as string | undefined) ||
      (meta.family_name as string | undefined);
    // Accounts that never went through the signup checkboxes (Google) still
    // need to accept the legal consents here.
    needsConsent = !profile?.terms_accepted_at;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center">
          <BrandLogo className="text-3xl" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 mb-8 text-sm text-muted-foreground">
          Quelques informations pour préparer votre espace. Vous pourrez ensuite
          confier votre première facture impayée à MyDueGuard.
        </p>

        <MyDueGuardOnboarding
          firstName={firstName}
          lastName={lastName}
          needsConsent={needsConsent}
        />
      </div>
    </div>
  );
}
