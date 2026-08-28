import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Paramètres" };

function maskIban(iban: string | null): string {
  if (!iban) return "—";
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
}

export default async function SettingsPage() {
  const supabase = await createClient();

  // Placeholder mode: Supabase not connected yet.
  if (!supabase) {
    return (
      <SettingsShell>
        <Card>
          <CardHeader>
            <CardTitle>Compte</CardTitle>
            <CardDescription>
              Connectez Supabase pour gérer votre compte.
            </CardDescription>
          </CardHeader>
        </Card>
      </SettingsShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—";

  return (
    <SettingsShell>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Profil professionnel</CardTitle>
            <CardDescription>Vos informations de compte.</CardDescription>
          </div>
          <SignOutButton />
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nom" value={fullName} />
          <Field label="Email" value={profile?.email ?? user.email ?? "—"} />
          <Field label="Nom commercial" value={profile?.business_name ?? "—"} />
          <Field label="SIREN / SIRET" value={profile?.siret ?? "—"} />
          <Field
            label="Statut professionnel"
            value={profile?.professional_status ?? "—"}
          />
          <Field label="Adresse" value={profile?.address ?? "—"} />
          <div className="pt-1">
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Modifier mon profil
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées de paiement</CardTitle>
          <CardDescription>
            Communiquées à vos clients. MyDueGuard n&apos;encaisse jamais vos
            paiements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titulaire" value={profile?.payee_name ?? "—"} />
          <Field label="IBAN" value={maskIban(profile?.iban ?? null)} />
          <Field label="BIC" value={profile?.bic ?? "—"} />
          <Field
            label="Mandat d'intervention"
            value={profile?.mandate_accepted_at ? "Accepté" : "Non accepté"}
          />
        </CardContent>
      </Card>

      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Zone sensible</CardTitle>
          <CardDescription>
            Supprimez définitivement votre compte et l&apos;ensemble de vos
            dossiers et documents. Cette action est irréversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BrandLogo className="text-xl" />
        </Link>
        <Link
          href="/dossiers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Retour aux dossiers
        </Link>
      </header>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Paramètres</h1>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
      <Separator className="mt-3" />
    </div>
  );
}
