import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { getCases } from "@/lib/cases/queries";
import { CaseCard } from "@/components/cases/case-card";
import { buttonVariants } from "@/components/ui/button";
import { formatEuro } from "@/lib/cases/format";
import { ACTIVE_CASE_STATUSES } from "@/lib/claimguard/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes dossiers" };

export default async function DossiersPage() {
  const { cases, isDemo } = await getCases();

  const active = cases.filter((c) =>
    ACTIVE_CASE_STATUSES.includes(c.status),
  );
  const outstanding = active.reduce(
    (sum, c) => sum + (c.remaining_amount ?? c.original_amount ?? 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes dossiers</h1>
          <p className="text-sm text-muted-foreground">
            {active.length} dossier{active.length === 1 ? "" : "s"} en cours ·{" "}
            {formatEuro(outstanding)} en attente de règlement
            {isDemo && " · données de démonstration"}
          </p>
        </div>
        <Link
          href="/dossiers/nouveau"
          className={cn(buttonVariants({ variant: "brand" }))}
        >
          <Plus className="size-4" />
          Nouveau dossier
        </Link>
      </div>

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
        <div className="grid gap-3 sm:grid-cols-2">
          {cases.map((c) => (
            <CaseCard key={c.id} case={c} />
          ))}
        </div>
      )}
    </div>
  );
}
