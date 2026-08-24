import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
} from "@/lib/claimguard/enums";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import type { Case } from "@/lib/claimguard/types";

export function AdminCaseTable({ cases }: { cases: Case[] }) {
  if (cases.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        Aucun dossier.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Référence</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Facture</th>
            <th className="px-4 py-3 font-medium">Montant</th>
            <th className="px-4 py-3 font-medium">Échéance</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Auto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cases.map((c) => (
            <tr key={c.id} className="hover:bg-accent/30">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/cases/${c.id}`}
                  className="font-mono text-xs text-brand hover:underline"
                >
                  {c.case_reference}
                </Link>
                {c.human_review_required && (
                  <Badge variant="warning" className="ml-2">
                    Revue
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">{c.debtor_name ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.invoice_number ?? "—"}
              </td>
              <td className="px-4 py-3 font-medium">
                {formatEuro(c.remaining_amount ?? c.original_amount)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateFr(c.due_date)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={CASE_STATUS_VARIANT[c.status]}>
                  {CASE_STATUS_LABELS[c.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {c.automation_enabled ? "Oui" : "Non"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
