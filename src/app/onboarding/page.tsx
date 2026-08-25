import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClaimGuardOnboarding } from "@/components/onboarding/claimguard-onboarding";

export const metadata: Metadata = { title: "Bienvenue sur ClaimGuard" };

interface ProfileNames {
  first_name: string | null;
  last_name: string | null;
}

export default async function OnboardingPage() {
  const supabase = await createClient();

  let firstName: string | undefined;
  let lastName: string | undefined;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirectTo=/onboarding");

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle<ProfileNames>();
    firstName =
      profile?.first_name ??
      (user.user_metadata?.first_name as string | undefined);
    lastName =
      profile?.last_name ??
      (user.user_metadata?.last_name as string | undefined);
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Claim<span className="text-brand">Guard</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 mb-8 text-sm text-muted-foreground">
          Quelques informations pour préparer votre espace. Vous pourrez ensuite
          confier votre première facture impayée à ClaimGuard.
        </p>

        <ClaimGuardOnboarding firstName={firstName} lastName={lastName} />
      </div>
    </div>
  );
}
