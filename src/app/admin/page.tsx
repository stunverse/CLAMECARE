import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { getAdminMetrics } from "@/lib/admin/metrics";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { formatEuro } from "@/lib/cases/format";

export const metadata: Metadata = { title: "Admin · Vue d'ensemble" };

export default async function AdminOverviewPage() {
  const { supabase } = await getAdminContext();
  const m = await getAdminMetrics(supabase);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminMetricCard label="Utilisateurs" value={m.totalUsers} />
        <AdminMetricCard label="Abonnés payants" value={m.paidUsers} />
        <AdminMetricCard
          label="MRR estimé"
          value={formatEuro(m.mrr)}
          hint="Abonnements actifs × prix mensuel"
        />
        <AdminMetricCard
          label="Montant recouvré"
          value={formatEuro(m.amountRecovered)}
          hint="Dossiers réglés / clôturés"
        />
        <AdminMetricCard label="Dossiers créés" value={m.casesCreated} />
        <AdminMetricCard label="Documents déposés" value={m.documentsUploaded} />
        <AdminMetricCard label="Emails envoyés" value={m.emailsSent} />
        <AdminMetricCard
          label="À examiner"
          value={m.toReview}
          hint="Dossiers en attente d'intervention humaine"
        />
      </div>
    </div>
  );
}
