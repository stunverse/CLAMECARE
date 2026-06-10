"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Upsell modal shown when a plan limit is reached (cahier des charges §46). */
export function UpgradeDialog({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
          <Sparkles className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">You&apos;ve hit your plan limit</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link
            href="/billing"
            className={cn(buttonVariants({ variant: "brand" }))}
          >
            View plans
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
