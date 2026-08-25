import type { Metadata } from "next";
import Link from "next/link";
import { Plus, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { getCases } from "@/lib/cases/queries";
import { getNextAction } from "@/lib/cases/dashboard";
import { CaseCard } from "@/components/cases/case-card";
import { KpiCard } from "@/components/admin/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/cases/format";
import {
  ACTIVE_CASE_STATUSES,
  CASE_STATUS_LABELS,
} from "@/lib/claimguard/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

const ACTION_STATUSES = [
  "missing_information",
  "client_action_required",
  "document_requested",
];

export default async function TableauDeBordPage() {
  const [{ cases, isDemo }, nextAction] = await Promise.all([
    getCases(),
    getNextAction(),
  ]);

  const active = cases.filter((c) => ACTIVE_CASE_STATUSES.includes(c.status));
  const sum = (list: typeof cases) =>
    list.reduce((s, c) => s + (c.remaining_amount ?? c.original_amount ?? 0), 0);

  const totalTracked = sum(cases.filter((c) => c.status !== "cancelled"));
  const waiting = sum(active.filter((c) => c.status !== "payment_promised"));
  const promised = sum(active.filter((c) => c.status === "payment_promised"));
  const settled = cases
    .filter((c) => c.status === "paid" || c.status === "closed")
    .reduce((s, c) => s + (c.original_amount ?? 0), 0);

  const actionNeeded = cases.filter((c) => ACTION_STATUSES.includes(c.status));
  const recent = [...cases]
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            ClaimGuard suit vos paiements pour vous.
            {isDemo && " · données de démonstration"}
          </p>
        </div>
        <Link
          href="/dossiers/nouveau"
          className={cn(buttonVariants({ variant: "brand" }), "shadow-sm")}
        >
          <Plus className="size-4" />
          Confier une facture
        </Link>
      </div>

      {/* Prochaine action ClaimGuard */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand">
              Prochaine action ClaimGuard
            </p>
            {nextAction ? (
              <>
                <p className="text-sm font-semibold">{nextAction.label}</p>
                <p className="text-sm text-muted-foreground">
                  {nextAction.detail}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune action planifiée pour l&apos;instant.
              </p>
            )}
          </div>
        </div>
        {nextAction && (
          <Link
            href={`/dossiers/${nextAction.caseId}`}
            className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Voir le dossier <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total suivi" value={formatEuro(totalTracked)} />
        <KpiCard label="En attente" value={formatEuro(waiting)} />
        <KpiCard label="Paiement promis" value={formatEuro(promised)} />
        <KpiCard label="Réglé" value={formatEuro(settled)} />
      </div>

      {actionNeeded.length > 0 && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertCircle className="size-4" />
            Action requise ({actionNeeded.length})
          </div>
          <ul className="space-y-2">
            {actionNeeded.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dossiers/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <span>
                    <span className="font-medium">{c.debtor_name ?? "Client"}</span>{" "}
                    — {CASE_STATUS_LABELS[c.status]}
                  </span>
                  <Badge variant="warning">À compléter</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Dossiers récents
        </h2>
        <Link
          href="/dossiers"
          className="text-sm font-medium text-brand hover:underline"
        >
          Tout voir
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <p className="font-medium">Aucun dossier pour l&apos;instant</p>
          <Link
            href="/dossiers/nouveau"
            className={cn(buttonVariants({ variant: "brand" }))}
          >
            <Plus className="size-4" />
            Créer mon premier dossier
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recent.map((c) => (
            <CaseCard key={c.id} case={c} />
          ))}
        </div>
      )}
    </div>
  );
}
