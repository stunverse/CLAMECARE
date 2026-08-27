import type { Metadata } from "next";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin/guard";
import { getAdminCases, getAdminStats } from "@/lib/admin/cases";
import { DEMO_CASES } from "@/lib/cases/demo";
import { KpiCard } from "@/components/admin/kpi-card";
import { AdminCaseTable } from "@/components/admin/admin-case-table";
import { formatEuro } from "@/lib/cases/format";
import { CASE_STATUSES, CASE_STATUS_LABELS } from "@/lib/claimguard/enums";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/lib/claimguard/enums";

export const metadata: Metadata = { title: "Admin · Dossiers" };

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { supabase } = await getAdminContext();
  const sp = await searchParams;
  const statusFilter = (sp.status as CaseStatus | "all" | "active") || "active";

  let cases = DEMO_CASES;
  let stats = {
    openCases: DEMO_CASES.filter(
      (c) => !["paid", "closed", "cancelled"].includes(c.status),
    ).length,
    totalTracked: DEMO_CASES.reduce(
      (s, c) => s + (c.remaining_amount ?? c.original_amount ?? 0),
      0,
    ),
    totalPaid: 1680,
    automated: 2,
    needsReview: 0,
    emailsSent: 3,
    emailsReceived: 1,
    resolutionRate: 0.33,
  };

  if (supabase) {
    [cases, stats] = await Promise.all([
      getAdminCases(supabase, {
        status: statusFilter,
        search: sp.q,
      }),
      getAdminStats(supabase),
    ]);
  }

  const filters: { key: string; label: string }[] = [
    { key: "active", label: "Actifs" },
    { key: "all", label: "Tous" },
    ...CASE_STATUSES.map((s) => ({ key: s, label: CASE_STATUS_LABELS[s] })),
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Dossiers</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Vue d&apos;ensemble et gestion de tous les dossiers MyDueGuard.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Dossiers ouverts" value={String(stats.openCases)} />
        <KpiCard label="Montant suivi" value={formatEuro(stats.totalTracked)} />
        <KpiCard label="Déclaré payé" value={formatEuro(stats.totalPaid)} />
        <KpiCard
          label="Taux de résolution"
          value={`${Math.round(stats.resolutionRate * 100)} %`}
        />
        <KpiCard label="Automatisés" value={String(stats.automated)} />
        <KpiCard
          label="À examiner"
          value={String(stats.needsReview)}
          hint="Intervention humaine"
        />
        <KpiCard label="Emails envoyés" value={String(stats.emailsSent)} />
        <KpiCard label="Emails reçus" value={String(stats.emailsReceived)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.slice(0, 8).map((f) => (
          <Link
            key={f.key}
            href={`/admin/cases?status=${f.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === f.key
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <AdminCaseTable cases={cases} />
    </div>
  );
}
