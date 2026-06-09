import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getBillingData } from "@/lib/billing/data";
import { PLAN_BY_ID } from "@/lib/billing/plans";
import { PricingTable } from "@/components/billing/pricing-table";
import { UsageLimitBanner } from "@/components/billing/usage-limit-banner";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { SUBSCRIPTION_PLAN_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const sp = await searchParams;
  const billing = await getBillingData();
  const plan = PLAN_BY_ID[billing.plan];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Billing</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage your plan and usage.
      </p>

      {sp.success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          Your subscription is active. Thank you!
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current plan */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Current plan</CardTitle>
            <Badge variant="info">{SUBSCRIPTION_PLAN_LABELS[billing.plan]}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            {billing.subscription?.current_period_end && (
              <p className="text-sm">
                Renews on{" "}
                <span className="font-medium">
                  {formatDate(billing.subscription.current_period_end)}
                </span>
                {billing.subscription.cancel_at_period_end &&
                  " · cancels at period end"}
              </p>
            )}
            {billing.subscription ? (
              <ManageBillingButton />
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;re on the free baseline. Choose a plan below to unlock
                more.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageLimitBanner
              label="Active claims"
              used={billing.usage.activeClaims}
              limit={billing.quota.active_claims_limit}
            />
            <UsageLimitBanner
              label="Generated documents"
              used={billing.usage.generatedDocuments}
              limit={billing.quota.generated_documents_limit}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <PricingTable
          mode="manage"
          currentPlan={billing.plan}
          stripeConfigured={billing.stripeConfigured}
        />
      </div>

      <div className="mt-8">
        <DisclaimerBanner variant="primary" />
      </div>
    </div>
  );
}
