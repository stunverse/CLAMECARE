import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { getAdminMetrics } from "@/lib/admin/metrics";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Overview" };

export default async function AdminOverviewPage() {
  const { supabase } = await getAdminContext();
  const m = await getAdminMetrics(supabase);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminMetricCard label="Total users" value={m.totalUsers} />
        <AdminMetricCard label="Paid users" value={m.paidUsers} />
        <AdminMetricCard
          label="Estimated MRR"
          value={formatCurrency(m.mrr)}
          hint="Active subscriptions × monthly price"
        />
        <AdminMetricCard label="Claims created" value={m.claimsCreated} />
        <AdminMetricCard label="Documents uploaded" value={m.documentsUploaded} />
        <AdminMetricCard label="Letters generated" value={m.lettersGenerated} />
        <AdminMetricCard label="AI analyses run" value={m.aiAnalyses} />
        <AdminMetricCard
          label="Conversion"
          value={
            m.totalUsers > 0
              ? `${Math.round((m.paidUsers / m.totalUsers) * 100)}%`
              : "—"
          }
          hint="Paid / total users"
        />
      </div>
    </div>
  );
}
