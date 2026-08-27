"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, Landmark, ShieldCheck } from "lucide-react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUSES = [
  "Auto-entrepreneur / micro-entreprise",
  "Entreprise individuelle (EI)",
  "EURL / SASU",
  "SARL / SAS",
  "Profession libérale",
  "Autre",
];

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MyDueGuardOnboarding({
  firstName,
  lastName,
}: {
  firstName?: string;
  lastName?: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-brand" />
            Votre profil professionnel
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field name="first_name" label="Prénom" defaultValue={firstName} />
          <Field name="last_name" label="Nom" defaultValue={lastName} />
          <div className="sm:col-span-2">
            <Field
              name="business_name"
              label="Nom commercial / raison sociale"
              placeholder="Ex. Nova Studio"
            />
          </div>
          <Field name="siret" label="SIREN / SIRET" placeholder="123 456 789 00012" />
          <div className="space-y-1.5">
            <Label htmlFor="professional_status">Statut professionnel</Label>
            <Select id="professional_status" name="professional_status" defaultValue="">
              <option value="">Sélectionner…</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Field
              name="address"
              label="Adresse professionnelle"
              placeholder="12 rue de la Paix, 75002 Paris"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="size-4 text-brand" />
            Vos coordonnées de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
            Ces coordonnées servent uniquement à indiquer à vos clients où vous
            régler. MyDueGuard n&apos;encaisse jamais vos paiements.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="payee_name"
              label="Titulaire du compte"
              defaultValue={fullName || undefined}
              placeholder="Prénom Nom / Raison sociale"
            />
            <Field name="bic" label="BIC (facultatif)" placeholder="AGRIFRPP" />
            <div className="sm:col-span-2">
              <Field name="iban" label="IBAN" placeholder="FR76 ...." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-brand" />
            Mandat d&apos;intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="accept_mandate"
              className="mt-1 size-4 shrink-0 rounded border-border"
            />
            <span className="text-muted-foreground">
              J&apos;autorise MyDueGuard à assurer, <strong>en mon nom et à
              l&apos;amiable</strong>, le suivi et la relance de mes factures
              impayées auprès de mes clients. MyDueGuard n&apos;encaisse jamais
              les sommes dues et n&apos;engage aucune procédure judiciaire sans
              ma décision.
            </span>
          </label>
        </CardContent>
      </Card>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Link
          href="/dossiers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Passer pour l&apos;instant
        </Link>
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Enregistrement…" : "Accéder à mon espace"}
        </Button>
      </div>
    </form>
  );
}
