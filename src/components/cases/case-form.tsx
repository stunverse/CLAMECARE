"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Landmark, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseDocumentUploader } from "@/components/cases/case-document-uploader";

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
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
        type={type}
        placeholder={placeholder}
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CaseForm({
  userId,
  bucket,
}: {
  userId: string | null;
  bucket: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsDemo(false);
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/cases/create", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        caseId?: string;
        error?: string;
        isDemo?: boolean;
      };
      if (data.caseId && !data.isDemo) {
        // Move to step 2 (attach the invoice) instead of leaving immediately.
        setCreatedCaseId(data.caseId);
        return;
      }
      if (data.isDemo) setIsDemo(true);
      if (data.error) setError(data.error);
    } catch {
      setError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  const state = { error, isDemo };

  // Step 2 — the dossier exists: attach the invoice and any supporting docs.
  if (createdCaseId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4" />
          Dossier créé. Ajoutez maintenant votre facture.
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-brand" />
              Ajoutez votre facture et vos justificatifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userId ? (
              <CaseDocumentUploader
                caseId={createdCaseId}
                userId={userId}
                bucket={bucket}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Connectez Supabase pour joindre des documents.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Vous pourrez aussi en ajouter plus tard depuis le dossier.
          </p>
          <Button
            type="button"
            variant="brand"
            onClick={() => router.push(`/dossiers/${createdCaseId}`)}
          >
            Terminer
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 1 — the invoice information.
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-brand" />
            Client / donneur d&apos;ordre (le débiteur)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              name="debtor_name"
              label="Nom du client / de l'entreprise"
              placeholder="Ex. Studio Nova SAS"
              required
            />
          </div>
          <Field
            name="debtor_email"
            label="Email de contact"
            type="email"
            placeholder="contact@client.fr"
          />
          <Field
            name="debtor_accounting_email"
            label="Email comptabilité"
            type="email"
            placeholder="compta@client.fr"
            hint="Utilisé en priorité pour les relances."
          />
          <div className="sm:col-span-2">
            <Field
              name="debtor_contact_name"
              label="Personne en charge (facultatif)"
              placeholder="Ex. Service comptabilité"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-brand" />
            Facture impayée
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            name="invoice_number"
            label="Numéro de facture"
            placeholder="F-2026-0117"
          />
          <Field name="invoice_date" label="Date de facture" type="date" />
          <Field
            name="due_date"
            label="Date d'échéance"
            type="date"
            hint="La date à laquelle le paiement était dû."
          />
          <Field
            name="original_amount"
            label="Montant dû TTC (€)"
            type="text"
            placeholder="3000"
            hint="Ou renseignez le HT + TVA ci-dessous."
          />
          <Field name="amount_ht" label="Montant HT (€)" placeholder="2500" />
          <Field name="vat_amount" label="TVA (€)" placeholder="500" />
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="service_description">Prestation concernée</Label>
            <Textarea
              id="service_description"
              name="service_description"
              rows={2}
              placeholder="Ex. Refonte du site vitrine — mission de 12 jours, juin 2026"
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
            Votre client vous règle <strong>directement</strong> sur votre
            compte. ClaimGuard ne perçoit jamais votre argent et ne communique
            jamais d&apos;autre compte que le vôtre.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="payee_name"
              label="Titulaire du compte"
              placeholder="Prénom Nom / Raison sociale"
            />
            <Field name="bic" label="BIC (facultatif)" placeholder="AGRIFRPP" />
            <div className="sm:col-span-2">
              <Field
                name="iban"
                label="IBAN"
                placeholder="FR76 ...."
                hint="Communiqué à votre client dans les relances, jamais publié."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.isDemo && (
        <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          Mode démonstration : connectez Supabase pour enregistrer réellement le
          dossier.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Création…" : "Continuer"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Étape suivante : joindre votre facture.
      </p>
    </form>
  );
}
