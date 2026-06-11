import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Pencil } from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { getClaimExpertReviews } from "@/lib/data/expert";
import { isSupabaseConfigured } from "@/lib/env";
import { getNextAction } from "@/lib/claim-actions";
import { StatusUpdater } from "@/components/claim/status-updater";
import { ExpertReviewCard } from "@/components/claim/expert-review-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ScoreCircle } from "@/components/score-circle";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { DENIAL_REASON_LABELS } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ClaimOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const nextAction = getNextAction(claim);
  const expertReviews = await getClaimExpertReviews(id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Summary</CardTitle>
            {isSupabaseConfigured && (
              <Link
                href={`/claims/${claim.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Pencil className="size-4" />
                Edit details
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your description
              </p>
              <p className="leading-relaxed">
                {claim.user_summary || "No description provided yet."}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                AI summary
              </p>
              {claim.ai_summary ? (
                <p className="leading-relaxed">{claim.ai_summary}</p>
              ) : (
                <p className="leading-relaxed text-muted-foreground">
                  Run a full analysis to generate an AI summary, detect the
                  denial reason, and surface strengths and weaknesses.
                </p>
              )}
            </div>
            {claim.detected_denial_reason && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Detected denial reason
                </p>
                <p className="font-medium">
                  {DENIAL_REASON_LABELS[claim.detected_denial_reason]}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Insurance company" value={claim.insurance_company} />
              <Detail label="Policy number" value={claim.policy_number} />
              <Detail label="Claim number" value={claim.claim_number} />
              <Detail label="State" value={claim.state} />
              <Detail label="Adjuster" value={claim.adjuster_name} />
              <Detail label="Deductible" value={formatCurrency(claim.deductible)} />
              <Detail label="Incident date" value={formatDate(claim.incident_date)} />
              <Detail label="Claim filed" value={formatDate(claim.claim_filed_date)} />
              <Detail label="Denial date" value={formatDate(claim.denial_date)} />
              <Detail
                label="Amount claimed"
                value={formatCurrency(claim.amount_claimed)}
              />
              <Detail
                label="Amount offered"
                value={formatCurrency(claim.amount_offered)}
              />
              <Detail
                label="Appeal deadline"
                value={formatDate(claim.appeal_deadline)}
              />
            </dl>
          </CardContent>
        </Card>

        <DisclaimerBanner variant="primary" />
      </div>

      {/* Side column */}
      <div className="space-y-6">
        {isSupabaseConfigured && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusUpdater
                claimId={claim.id}
                current={claim.current_status}
                canEdit={isSupabaseConfigured}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claim strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-center">
              <ScoreCircle score={claim.success_score} size="lg" showBand />
            </div>
            <ScoreBreakdown claim={claim} />
            <p className="text-xs text-muted-foreground">
              This score measures the apparent strength of your file based on
              the information available. It is not a prediction or a guarantee
              of any outcome.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-brand" />
              Next step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm font-medium">{nextAction.label}</p>
            <Link
              href={nextAction.href}
              className={cn(buttonVariants({ variant: "brand" }), "w-full")}
            >
              Continue
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <ExpertReviewCard
          claimId={claim.id}
          canRequest={isSupabaseConfigured}
          initialReviews={expertReviews}
        />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}
