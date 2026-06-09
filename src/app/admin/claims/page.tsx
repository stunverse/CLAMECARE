import type { Metadata } from "next";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin/guard";
import { DEMO_CLAIMS } from "@/lib/data/demo";
import { Card } from "@/components/ui/card";
import { ClaimStatusBadge } from "@/components/claim-status-badge";
import { ScoreCircle } from "@/components/score-circle";
import { INSURANCE_TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Claim } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Claims" };

export default async function AdminClaimsPage() {
  const { supabase } = await getAdminContext();

  let claims: Claim[] = DEMO_CLAIMS;
  if (supabase) {
    const { data } = await supabase
      .from("claims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Claim[]>();
    claims = data ?? [];
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Claims</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {claims.length} claims
      </p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-accent/40"
                >
                  <td className="px-4 py-3">
                    <ScoreCircle score={c.success_score} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/claims/${c.id}`} className="hover:underline">
                      {c.claim_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.insurance_type
                      ? INSURANCE_TYPE_LABELS[c.insurance_type]
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{c.insurance_company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ClaimStatusBadge status={c.current_status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
