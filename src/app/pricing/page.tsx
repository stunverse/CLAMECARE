import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PricingTable } from "@/components/billing/pricing-table";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { buttonVariants } from "@/components/ui/button";
import { isStripeConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              ClaimCare<span className="text-brand"> AI</span>
            </span>
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Choose the plan that fits your claim. Upgrade, downgrade, or cancel
            anytime.
          </p>
        </div>

        <PricingTable mode="marketing" stripeConfigured={isStripeConfigured} />

        <div className="mx-auto mt-10 max-w-3xl">
          <DisclaimerBanner variant="primary" />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} ClaimCare AI. Not a law firm.
        </div>
      </footer>
    </div>
  );
}
