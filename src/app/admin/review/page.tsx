import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { getReviewQueue, type ReviewPriority } from "@/lib/admin/cases";
import { Badge } from "@/components/ui/badge";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
} from "@/lib/claimguard/enums";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import type { StatusVariant } from "@/lib/claimguard/enums";

export const metadata: Metadata = { title: "Admin · À examiner" };

const PRIORITY_VARIANT: Record<ReviewPriority, StatusVariant> = {
  critical: "danger",
  high: "warning",
  normal: "info",
};
const PRIORITY_LABEL: Record<ReviewPriority, string> = {
  critical: "Critique",
  high: "Haute",
  normal: "Normale",
};

export default async function AdminReviewPage() {
  const { supabase } = await getAdminContext();
  const items = supabase ? await getReviewQueue(supabase) : [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">À examiner</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {items.length} dossier{items.length === 1 ? "" : "s"} nécessitant une
        intervention humaine, les plus urgents en premier.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <AlertTriangle className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Rien à examiner pour l&apos;instant. L&apos;automatisation gère les
            dossiers en cours.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(({ case: c, reason }) => (
            <li key={c.id}>
              <Link
                href={`/admin/cases/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-brand/50 hover:bg-accent/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={PRIORITY_VARIANT[reason.priority]}>
                      {PRIORITY_LABEL[reason.priority]}
                    </Badge>
                    <span className="font-medium">{reason.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.debtor_name ?? "Organisme"} ·{" "}
                    <span className="font-mono text-xs">{c.case_reference}</span>{" "}
                    · {formatEuro(c.remaining_amount ?? c.original_amount)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={CASE_STATUS_VARIANT[c.status]}>
                    {CASE_STATUS_LABELS[c.status]}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Échéance {formatDateFr(c.due_date)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
