import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { isSupabaseConfigured } from "@/lib/env";
import { mockAnalyzeClaim } from "@/lib/ai";
import type { AnalyzeClaimResult } from "@/lib/ai/types";
import { AnalysisView } from "@/components/claim/analysis-view";
import { RunAnalysisButton } from "@/components/claim/run-analysis-button";
import { Card, CardContent } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function AnalysisTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const persisted = claim.ai_analysis as unknown as AnalyzeClaimResult | null;
  const analysis: AnalyzeClaimResult | null =
    persisted ??
    (!isSupabaseConfigured
      ? mockAnalyzeClaim({ claim, documents: [] })
      : null);

  return (
    <div className="space-y-4">
      {claim.insurance_type === "health" && (
        <DisclaimerBanner variant="health" />
      )}

      {analysis ? (
        <>
          {isSupabaseConfigured ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Based on the information available for this claim.
              </p>
              <RunAnalysisButton claimId={id} label="Re-run analysis" />
            </div>
          ) : (
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
              Demo analysis. Connect Supabase and upload documents for a saved,
              document-aware analysis.
            </div>
          )}
          <AnalysisView analysis={analysis} />
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
              <Sparkles className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">Run a full AI analysis</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              ClaimCare AI will review your claim and documents to detect the
              denial reason, surface strengths and weaknesses, score your file,
              and recommend a step-by-step strategy.
            </p>
            <div className="mt-5 flex justify-center">
              <RunAnalysisButton claimId={id} />
            </div>
          </CardContent>
        </Card>
      )}

      <DisclaimerBanner variant="primary" />
    </div>
  );
}
