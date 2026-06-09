import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardClaims } from "@/components/dashboard/dashboard-claims";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Claims" };

export default async function ClaimsPage() {
  const { claims, isDemo } = await getDashboardData();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Claims</h1>
          <p className="text-sm text-muted-foreground">
            {claims.length} {claims.length === 1 ? "claim" : "claims"}
            {isDemo && " · demo data"}
          </p>
        </div>
        <Link
          href="/claims/new"
          className={cn(buttonVariants({ variant: "brand" }))}
        >
          <Plus className="size-4" />
          New claim
        </Link>
      </div>

      <DashboardClaims claims={claims} />
    </div>
  );
}
