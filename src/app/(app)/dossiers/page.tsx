import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FolderOpen, AlertCircle } from "lucide-react";
import { getCases } from "@/lib/cases/queries";
import { CaseList } from "@/components/cases/case-list";
import { KpiCard } from "@/components/admin/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/cases/format";
import {
  ACTIVE_CASE_STATUSES,
  CASE_STATUS_LABELS,
} from "@/lib/claimguard/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes dossiers" };

const ACTION_STATUSES = [
  "missing_information",
  "client_action_required",
  "document_requested",
];

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const { cases, isDemo } = await getCases();

  const active = cases.filter((c) => ACTIVE_CASE_STATUSES.includes(c.status));
  const sum = (list: typeof cases) =>
    list.reduce(
      (s, c) => s + (c.remaining_amount ?? c.original_amount ?? 0),
      0,
    );

  const totalTracked = sum(
    cases.filter((c) => c.status !== "cancelled"),
  );
  const waiting = sum(
    active.filter((c) => c.status !== "payment_promised"),
  );
  const promised = sum(active.filter((c) => c.status === "payment_promised"));
  const settled = cases
    .filter((c) => c.status === "paid" || c.status === "closed")
    .reduce((s, c) => s + (c.original_amount ?? 0), 0);

  const actionNeeded = cases.filter((c) =>
    ACTION_STATUSES.includes(c.status),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes dossiers</h1>
          <p className="text-sm text-muted-foreground">
            Déposez votre facture, ClaimGuard s&apos;occupe du suivi.
            {isDemo && " · données de démonstration"}
          </p>
        </div>
        <Link
          href="/dossiers/nouveau"
          className={cn(buttonVariants({ variant: "brand" }), "shadow-sm")}
        >
          <Plus className="size-4" />
          Confier une facture à ClaimGuard
        </Link>
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
            Action requise
          </div>
          <ul className="space-y-2">
            {actionNeeded.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dossiers/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <span>
                    <span className="font-medium">
                      {c.debtor_name ?? "Client"}
                    </span>{" "}
                    — {CASE_STATUS_LABELS[c.status]}
                  </span>
                  <Badge variant="warning">À compléter</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <FolderOpen className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Aucun dossier pour l&apos;instant</p>
            <p className="text-sm text-muted-foreground">
              Déposez une facture impayée, ClaimGuard s&apos;occupe du reste.
            </p>
          </div>
          <Link
            href="/dossiers/nouveau"
            className={cn(buttonVariants({ variant: "brand" }))}
          >
            <Plus className="size-4" />
            Créer mon premier dossier
          </Link>
        </div>
      ) : (
        <CaseList cases={cases} initialQuery={client ?? ""} />
      )}
    </div>
  );
}
