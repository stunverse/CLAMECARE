"use client";

import { useState } from "react";
import Link from "next/link";
import { BillingPlanCard } from "@/components/billing/plan-card";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { PLANS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/types/enums";

type Interval = "monthly" | "yearly";

export function PricingTable({
  mode,
  currentPlan,
  stripeConfigured,
}: {
  mode: "marketing" | "manage";
  currentPlan?: SubscriptionPlan;
  stripeConfigured: boolean;
}) {
  const [interval, setInterval] = useState<Interval>("monthly");

  return (
    <div>
      {/* Interval toggle */}
      <div className="mb-6 flex items-center justify-center gap-1 rounded-full border border-border bg-card p-1 text-sm font-medium sm:w-fit sm:mx-auto">
        {(["monthly", "yearly"] as Interval[]).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInterval(i)}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              interval === i
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {i === "monthly" ? "Monthly" : "Yearly"}
            {i === "yearly" && (
              <span className="ml-1 text-xs text-success">2 months free</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = mode === "manage" && currentPlan === plan.id;
          let cta: React.ReactNode;

          if (mode === "marketing") {
            cta = (
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({
                    variant: plan.highlighted ? "brand" : "outline",
                  }),
                  "w-full",
                )}
              >
                Get started
              </Link>
            );
          } else if (!stripeConfigured) {
            cta = (
              <Button variant="outline" className="w-full" disabled>
                Billing not connected
              </Button>
            );
          } else if (isCurrent) {
            cta = (
              <Button variant="outline" className="w-full" disabled>
                Current plan
              </Button>
            );
          } else {
            cta = (
              <CheckoutButton
                plan={plan.id}
                interval={interval}
                variant={plan.highlighted ? "brand" : "default"}
                label="Choose plan"
              />
            );
          }

          return (
            <BillingPlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              badge={isCurrent ? "Current" : undefined}
              cta={cta}
            />
          );
        })}
      </div>
    </div>
  );
}
