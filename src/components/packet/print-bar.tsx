"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrintBar({ claimId }: { claimId: string }) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link
          href={`/claims/${claimId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="size-4" />
          Back to claim
        </Link>
        <Button variant="brand" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Download / Save as PDF
        </Button>
      </div>
    </div>
  );
}
