"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runClaimAnalysis } from "@/lib/ai/actions";

export function RunAnalysisButton({
  claimId,
  label = "Run full analysis",
}: {
  claimId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const { error } = await runClaimAnalysis(claimId);
      if (error) {
        window.alert(error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="brand" onClick={run} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {pending ? "Analyzing…" : label}
    </Button>
  );
}
