import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { getCase } from "@/lib/cases/queries";
import { AdminCaseActions } from "@/components/admin/admin-case-actions";
import { CaseEmails } from "@/components/cases/case-emails";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { CaseDocuments } from "@/components/cases/case-documents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  CASE_RISK_LABELS,
} from "@/lib/claimguard/enums";
import { formatEuro, formatDateFr } from "@/lib/cases/format";

export const metadata: Metadata = { title: "Admin · Dossier" };

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Guard: staff only (redirect/404 handled inside).
  await getAdminContext();
  const { id } = await params;
  const detail = await getCase(id);
  if (!detail) notFound();

  const { case: c, documents, timeline, messages } = detail;

  return (
    <div>
      <Link
        href="/admin/cases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Dossiers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            {c.debtor_name ?? "Organisme"} —{" "}
            {formatEuro(c.remaining_amount ?? c.original_amount)}
            <Badge variant={CASE_STATUS_VARIANT[c.status]}>
              {CASE_STATUS_LABELS[c.status]}
            </Badge>
          </h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {c.case_reference} · Facture {c.invoice_number ?? "—"} · Échéance{" "}
            {formatDateFr(c.due_date)} · Risque {CASE_RISK_LABELS[c.risk_level]}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {c.ai_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Résumé ClaimGuard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Échanges</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseEmails messages={messages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseDocuments documents={documents} />
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
              <CardTitle className="text-base">Actions staff</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminCaseActions
                caseId={c.id}
                status={c.status}
                automationEnabled={c.automation_enabled}
                humanReviewRequired={c.human_review_required}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
