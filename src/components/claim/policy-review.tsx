"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PolicyView } from "@/components/claim/policy-view";
import { analyzePolicyAction } from "@/lib/policy/actions";
import type { PolicyAnalysisResult } from "@/lib/ai/policy";

export function PolicyReview({
  claimId,
  initialResult,
  prefillText = "",
}: {
  claimId: string;
  initialResult: PolicyAnalysisResult | null;
  prefillText?: string;
}) {
  const [policyText, setPolicyText] = useState(prefillText);
  const [result, setResult] = useState<PolicyAnalysisResult | null>(
    initialResult,
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function analyze() {
    setError(undefined);
    startTransition(async () => {
      const res = await analyzePolicyAction({ claimId, policyText });
      if (res.error || !res.result) {
        setError(res.error ?? "Could not analyze the policy.");
        return;
      }
      setResult(res.result);
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="space-y-2">
            <Label htmlFor="policy-text">
              Paste your policy text or declarations page
            </Label>
            <Textarea
              id="policy-text"
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              placeholder="Paste the coverage, exclusions, deductible, and limit sections of your policy here. We only analyze what you paste — we never guess at clauses."
              className="min-h-44"
            />
          </div>
          <Button variant="brand" onClick={analyze} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {pending ? "Reviewing…" : "Review my policy"}
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Tip: you can upload your full policy in the Documents tab and paste
            the most relevant sections here.
          </p>
        </CardContent>
      </Card>

      {result && <PolicyView result={result} />}
    </div>
  );
}
