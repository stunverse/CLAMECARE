"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runClaimAnalysis } from "@/lib/ai/actions";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";

export function RunAnalysisButton({
  claimId,
  label = "Run full analysis",
}: {
  claimId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [upgrade, setUpgrade] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      const res = await runClaimAnalysis(claimId);
      if (res.upgrade) {
        setUpgrade(res.error ?? "Plan limit reached.");
        return;
      }
      if (res.error) {
        window.alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="brand" onClick={run} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {pending ? "Analyzing…" : label}
      </Button>
      {upgrade && (
        <UpgradeDialog message={upgrade} onClose={() => setUpgrade(null)} />
      )}
    </>
  );
}
