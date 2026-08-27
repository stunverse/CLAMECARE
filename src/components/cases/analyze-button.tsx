"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { analyzeCase } from "@/lib/cases/analysis";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await analyzeCase(caseId);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="brand"
        className="w-full"
        onClick={run}
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analyse en cours…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Analyser le dossier
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        MyDueGuard lit vos documents et complète les informations manquantes.
        Vos saisies ne sont jamais écrasées.
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
