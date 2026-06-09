import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Sparkles,
  FileText,
  Landmark,
  Package,
} from "lucide-react";
import { ClaimStatusBadge } from "@/components/claim-status-badge";
import { ScoreCircle } from "@/components/score-circle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  INSURANCE_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANT,
} from "@/lib/labels";
import { formatCurrency, formatDeadline, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Claim } from "@/lib/types";

export function ClaimHeader({ claim }: { claim: Claim }) {
  const base = `/claims/${claim.id}`;
  const deadlineDays = daysUntil(claim.appeal_deadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 5;

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
        <Link
          href="/claims"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All claims
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <ScoreCircle score={claim.success_score} size="md" showBand />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">
                {claim.claim_title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ClaimStatusBadge status={claim.current_status} />
                <Badge variant={PRIORITY_VARIANT[claim.priority_level]}>
                  {PRIORITY_LABELS[claim.priority_level]} priority
                </Badge>
                {claim.insurance_type && (
                  <span className="text-sm text-muted-foreground">
                    {INSURANCE_TYPE_LABELS[claim.insurance_type]}
                  </span>
                )}
                {claim.insurance_company && (
                  <span className="text-sm text-muted-foreground">
                    · {claim.insurance_company}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <Fact label="Claimed" value={formatCurrency(claim.amount_claimed)} />
                <Fact label="Offered" value={formatCurrency(claim.amount_offered)} />
                {claim.appeal_deadline && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      deadlineUrgent ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    <CalendarClock className="size-4" />
                    {formatDeadline(claim.appeal_deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`${base}/analysis`}
            className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
          >
            <Sparkles className="size-4" />
            Run full analysis
          </Link>
          <Link
            href={`${base}/letters`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FileText className="size-4" />
            Generate appeal letter
          </Link>
          <Link
            href={`${base}/complaint`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Landmark className="size-4" />
            Prepare complaint
          </Link>
          <Link
            href={`/packet/${claim.id}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Package className="size-4" />
            Export packet
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
