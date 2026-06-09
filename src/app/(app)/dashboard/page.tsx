import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderOpen,
  CheckCircle2,
  FileText,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { getNextAction, isActiveClaim } from "@/lib/claim-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardClaims } from "@/components/dashboard/dashboard-claims";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { formatDeadline, formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { isDemo, claims, recentDocuments, stats } = await getDashboardData();

  const activeClaims = claims.filter((c) => isActiveClaim(c.current_status));

  const recommended = activeClaims.slice(0, 4);

  const deadlines = activeClaims
    .filter((c) => c.appeal_deadline)
    .sort(
      (a, b) =>
        (daysUntil(a.appeal_deadline) ?? Infinity) -
        (daysUntil(b.appeal_deadline) ?? Infinity),
    )
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your claims and your next best actions.
          </p>
        </div>
        {isDemo && (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-foreground">
            Demo data — connect Supabase to see your claims
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active claims" value={stats.activeClaims} icon={FolderOpen} />
        <StatCard
          label="Resolved claims"
          value={stats.resolvedClaims}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Documents generated"
          value={stats.documentsGenerated}
          icon={FileText}
        />
        <StatCard
          label="Urgent actions"
          value={stats.urgentActions}
          icon={AlertTriangle}
          tone={stats.urgentActions > 0 ? "danger" : "brand"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Claims list */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Your claims</h2>
          <DashboardClaims claims={claims} />
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-3">
              <Sparkles className="size-4 text-brand" />
              <CardTitle className="text-base">Recommended actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommended.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No actions right now.
                </p>
              ) : (
                recommended.map((c) => {
                  const action = getNextAction(c);
                  return (
                    <Link
                      key={c.id}
                      href={action.href}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.claim_title}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-3">
              <CalendarClock className="size-4 text-warning" />
              <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming deadlines.
                </p>
              ) : (
                deadlines.map((c) => {
                  const days = daysUntil(c.appeal_deadline);
                  const urgent = days !== null && days <= 5;
                  return (
                    <Link
                      key={c.id}
                      href={`/claims/${c.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {c.claim_title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(c.appeal_deadline)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          urgent ? "text-danger" : "text-muted-foreground",
                        )}
                      >
                        {formatDeadline(c.appeal_deadline)}
                      </span>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-3">
              <FileText className="size-4 text-brand" />
              <CardTitle className="text-base">Recent documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents generated yet.
                </p>
              ) : (
                recentDocuments.map((d) => (
                  <Link
                    key={d.id}
                    href={`/claims/${d.claim_id}/letters`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {d.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(d.created_at)}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <DisclaimerBanner variant="primary" />
      </div>
    </div>
  );
}
