import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { getAnalytics } from "@/lib/admin/analytics";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
} from "@/lib/claimguard/enums";
import { formatEuro } from "@/lib/cases/format";

export const metadata: Metadata = { title: "Admin · Analytics" };

export default async function AdminAnalyticsPage() {
  const { supabase } = await getAdminContext();

  const analytics = supabase
    ? await getAnalytics(supabase)
    : {
        total: 3,
        byStatus: [
          { status: "waiting_for_organization" as const, count: 1 },
          { status: "paid" as const, count: 1 },
          { status: "draft" as const, count: 1 },
        ],
        resolutionRate: 0.33,
        avgResolutionDays: 12.5,
        automationShare: 1,
        promiseKeptRate: 1,
        totalTracked: 3000,
        totalPaid: 1680,
      };

  const maxCount = Math.max(1, ...analytics.byStatus.map((b) => b.count));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Analytics</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Indicateurs de performance de la résolution des dossiers.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Taux de résolution"
          value={`${Math.round(analytics.resolutionRate * 100)} %`}
          hint={`${analytics.total} dossiers au total`}
        />
        <KpiCard
          label="Délai moyen de résolution"
          value={
            analytics.avgResolutionDays !== null
              ? `${analytics.avgResolutionDays} j`
              : "—"
          }
        />
        <KpiCard
          label="Part automatisée"
          value={`${Math.round(analytics.automationShare * 100)} %`}
          hint="Dossiers actifs"
        />
        <KpiCard
          label="Promesses tenues"
          value={
            analytics.promiseKeptRate !== null
              ? `${Math.round(analytics.promiseKeptRate * 100)} %`
              : "—"
          }
        />
        <KpiCard label="Montant suivi" value={formatEuro(analytics.totalTracked)} />
        <KpiCard label="Déclaré payé" value={formatEuro(analytics.totalPaid)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analytics.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun dossier.</p>
          ) : (
            analytics.byStatus.map((b) => (
              <div key={b.status} className="flex items-center gap-3">
                <div className="w-40 shrink-0">
                  <Badge variant={CASE_STATUS_VARIANT[b.status]}>
                    {CASE_STATUS_LABELS[b.status]}
                  </Badge>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">
                  {b.count}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
