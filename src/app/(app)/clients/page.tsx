import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { getClientSummaries } from "@/lib/clients/queries";
import { Badge } from "@/components/ui/badge";
import { formatEuro, formatDateFr } from "@/lib/cases/format";

export const metadata: Metadata = { title: "Mes clients" };

export default async function ClientsPage() {
  const { clients, isDemo } = await getClientSummaries();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mes clients</h1>
        <p className="text-sm text-muted-foreground">
          {clients.length} client{clients.length === 1 ? "" : "s"} suivi
          {clients.length === 1 ? "" : "s"}
          {isDemo && " · données de démonstration"}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Vos clients apparaîtront ici dès votre premier dossier.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((c) => (
            <Link
              key={c.name}
              href={`/dossiers?client=${encodeURIComponent(c.name)}`}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/50 hover:bg-accent/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                </div>
                {c.overdueCount > 0 && (
                  <Badge variant="danger">
                    {c.overdueCount} en retard
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-semibold tracking-tight">
                  {formatEuro(c.outstanding)}
                </span>
                <span className="text-xs text-muted-foreground">en attente</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {c.activeCount} dossier{c.activeCount === 1 ? "" : "s"} en cours
                </span>
                <span>·</span>
                <span>{c.caseCount} au total</span>
                {c.settled > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatEuro(c.settled)} réglé</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Dernière activité le {formatDateFr(c.lastActivity)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
