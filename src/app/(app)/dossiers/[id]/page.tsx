import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, CalendarClock, Sparkles } from "lucide-react";
import { getCase } from "@/lib/cases/queries";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { DEFAULT_BUCKET } from "@/lib/documents/constants";
import { computeCompleteness } from "@/lib/cases/completeness";
import { CaseDocumentUploader } from "@/components/cases/case-document-uploader";
import { CaseDocuments } from "@/components/cases/case-documents";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { CaseCompleteness } from "@/components/cases/case-completeness";
import { AnalyzeButton } from "@/components/cases/analyze-button";
import { CasePayment } from "@/components/cases/case-payment";
import { CaseEmails } from "@/components/cases/case-emails";
import { CaseCompose } from "@/components/cases/case-compose";
import {
  renderCaseEmail,
  kindForReminder,
} from "@/lib/claimguard/email/templates";
import { isEmailConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  CASE_RISK_LABELS,
} from "@/lib/claimguard/enums";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import type {
  Case,
  CaseDocument,
  CaseTimelineEntry,
  EmailMessage,
} from "@/lib/claimguard/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getCase(id);
  return { title: detail ? `Dossier ${detail.case.case_reference}` : "Dossier" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCase(id);
  if (!detail) notFound();

  const { case: c, documents, timeline, messages, isDemo } = detail;

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const bucket = env.STORAGE_BUCKET_CLAIM_DOCUMENTS || DEFAULT_BUCKET;

  const completeness = computeCompleteness({
    debtor_name: c.debtor_name,
    debtor_email: c.debtor_email,
    debtor_accounting_email: c.debtor_accounting_email,
    invoice_number: c.invoice_number,
    invoice_date: c.invoice_date,
    due_date: c.due_date,
    original_amount: c.original_amount,
    amount_ht: c.amount_ht,
    service_description: c.service_description,
    payee_name: c.payee_name,
    iban: c.iban,
    documentCount: documents.length,
    hasInvoiceDocument: documents.some((d) => d.document_category === "invoice"),
  });

  const draftKind = kindForReminder(c.reminder_count);
  const rendered = renderCaseEmail(draftKind, c);
  const draftReady = !isDemo
    ? {
        subject: rendered.subject,
        body: rendered.body,
        to: c.debtor_accounting_email || c.debtor_email || null,
      }
    : null;
  const kindLabel =
    c.reminder_count > 0 ? "Envoyer une relance" : "Contacter le client";

  return renderPage({
    c,
    documents,
    timeline,
    messages,
    isDemo,
    user,
    bucket,
    completeness,
    draftReady,
    kindLabel,
  });
}

function renderPage({
  c,
  documents,
  timeline,
  messages,
  isDemo,
  user,
  bucket,
  completeness,
  draftReady,
  kindLabel,
}: {
  c: Case;
  documents: CaseDocument[];
  timeline: CaseTimelineEntry[];
  messages: EmailMessage[];
  isDemo: boolean;
  user: { id: string } | null;
  bucket: string;
  completeness: ReturnType<typeof computeCompleteness>;
  draftReady: { subject: string; body: string; to: string | null } | null;
  kindLabel: string;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <Link
        href="/dossiers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Mes dossiers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            {c.debtor_name ?? "Client à renseigner"}
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold tracking-tight">
            {formatEuro(c.remaining_amount ?? c.original_amount)}
            <Badge variant={CASE_STATUS_VARIANT[c.status]}>
              {CASE_STATUS_LABELS[c.status]}
            </Badge>
          </h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {c.case_reference}
          </p>
        </div>
      </div>

      {isDemo && (
        <p className="mb-6 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          Dossier de démonstration. Connectez Supabase pour gérer vos vrais
          dossiers.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {c.ai_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-brand" />
                  Synthèse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facture</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <InfoRow label="Numéro" value={c.invoice_number} />
                <InfoRow
                  label="Date de facture"
                  value={formatDateFr(c.invoice_date)}
                />
                <InfoRow
                  label="Échéance"
                  value={formatDateFr(c.due_date)}
                />
                <InfoRow
                  label="Montant HT"
                  value={formatEuro(c.amount_ht)}
                />
                <InfoRow label="TVA" value={formatEuro(c.vat_amount)} />
                <InfoRow
                  label="Total TTC"
                  value={formatEuro(c.original_amount)}
                />
                <InfoRow
                  label="Reste à percevoir"
                  value={formatEuro(c.remaining_amount ?? c.original_amount)}
                />
                <InfoRow
                  label="Prestation"
                  value={c.service_description}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CaseDocuments documents={documents} />
              {user && (
                <div className="border-t border-border pt-4">
                  <CaseDocumentUploader
                    caseId={c.id}
                    userId={user.id}
                    bucket={bucket}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Échanges avec le client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CaseEmails messages={messages} />
              {draftReady && user && (
                <div className="border-t border-border pt-4">
                  <CaseCompose
                    caseId={c.id}
                    to={draftReady.to}
                    initialSubject={draftReady.subject}
                    initialBody={draftReady.body}
                    kindLabel={kindLabel}
                    emailConfigured={isEmailConfigured}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseTimeline entries={timeline} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complétude du dossier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CaseCompleteness result={completeness} />
              {user && !isDemo && <AnalyzeButton caseId={c.id} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <InfoRow label="Nom" value={c.debtor_name} />
                <InfoRow
                  label="Email"
                  value={
                    c.debtor_email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {c.debtor_email}
                      </span>
                    )
                  }
                />
                <InfoRow
                  label="Comptabilité"
                  value={c.debtor_accounting_email}
                />
                <InfoRow label="Contact" value={c.debtor_contact_name} />
                <InfoRow
                  label="Niveau de risque"
                  value={CASE_RISK_LABELS[c.risk_level]}
                />
              </dl>
            </CardContent>
          </Card>

          {user && !isDemo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <CasePayment
                  caseId={c.id}
                  status={c.status}
                  outstanding={c.remaining_amount ?? c.original_amount}
                  promisedDate={c.promised_payment_date}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Votre règlement</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <InfoRow label="Titulaire" value={c.payee_name} />
                <InfoRow label="IBAN" value={c.iban} />
                <InfoRow label="BIC" value={c.bic} />
              </dl>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3" />
                Votre client règle directement sur ce compte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
