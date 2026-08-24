import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  completenessBand,
} from "@/lib/claimguard/enums";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import { daysUntil } from "@/lib/format";
import type { Case } from "@/lib/claimguard/types";

function dueLabel(due: string | null): { text: string; overdue: boolean } {
  const days = daysUntil(due);
  if (days === null) return { text: "Échéance non renseignée", overdue: false };
  if (days < 0)
    return { text: `En retard de ${Math.abs(days)} j`, overdue: true };
  if (days === 0) return { text: "Échéance aujourd'hui", overdue: true };
  return { text: `Échéance dans ${days} j`, overdue: false };
}

export function CaseCard({ case: c }: { case: Case }) {
  const due = dueLabel(c.due_date);
  const band = completenessBand(c.completeness_score);

  return (
    <Link
      href={`/dossiers/${c.id}`}
      className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/50 hover:bg-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">
              {c.debtor_name ?? "Client à renseigner"}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {c.case_reference}
          </p>
        </div>
        <Badge variant={CASE_STATUS_VARIANT[c.status]}>
          {CASE_STATUS_LABELS[c.status]}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-xl font-semibold tracking-tight">
          {formatEuro(c.remaining_amount ?? c.original_amount)}
        </span>
        {c.invoice_number && (
          <span className="text-xs text-muted-foreground">
            Facture {c.invoice_number}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={band.variant}>{band.label}</Badge>
          <span
            className={
              due.overdue
                ? "text-xs font-medium text-danger"
                : "text-xs text-muted-foreground"
            }
          >
            {due.text}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
          Ouvrir <ArrowRight className="size-3" />
        </span>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Mis à jour le {formatDateFr(c.updated_at)}
      </p>
    </Link>
  );
}
