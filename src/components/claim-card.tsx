import Link from "next/link";
import { ArrowRight, Building2, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ClaimStatusBadge } from "@/components/claim-status-badge";
import { ScoreCircle } from "@/components/score-circle";
import { getNextAction } from "@/lib/claim-actions";
import { INSURANCE_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_VARIANT } from "@/lib/labels";
import { formatDeadline, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Claim } from "@/lib/types";

export function ClaimCard({ claim }: { claim: Claim }) {
  const nextAction = getNextAction(claim);
  const deadlineDays = daysUntil(claim.appeal_deadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 5;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 p-5">
        <ScoreCircle score={claim.success_score} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold">{claim.claim_title}</h3>
            <Badge variant={PRIORITY_VARIANT[claim.priority_level]}>
              {PRIORITY_LABELS[claim.priority_level]}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {claim.insurance_type && (
              <span>{INSURANCE_TYPE_LABELS[claim.insurance_type]}</span>
            )}
            {claim.insurance_company && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" />
                {claim.insurance_company}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ClaimStatusBadge status={claim.current_status} />
            {claim.appeal_deadline && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  deadlineUrgent ? "text-danger" : "text-muted-foreground",
                )}
              >
                <CalendarClock className="size-3.5" />
                {formatDeadline(claim.appeal_deadline)}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="truncate text-sm">
              <span className="text-muted-foreground">Next: </span>
              <span className="font-medium">{nextAction.label}</span>
            </p>
            <Link
              href={`/claims/${claim.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              Open claim
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
