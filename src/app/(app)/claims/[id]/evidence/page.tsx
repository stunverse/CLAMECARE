import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { getClaimEvidence } from "@/lib/data/evidence";
import { isSupabaseConfigured } from "@/lib/env";
import { mockAnalyzeClaim } from "@/lib/ai";
import {
  EvidenceChecklist,
  type ChecklistItem,
} from "@/components/claim/evidence-checklist";
import { RunAnalysisButton } from "@/components/claim/run-analysis-button";
import { Card, CardContent } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function EvidenceTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const rows = await getClaimEvidence(id);

  let items: ChecklistItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    importance: r.importance,
    status: r.status,
    ai_reason: r.ai_reason,
    how_to_get_it: r.how_to_get_it,
  }));

  // Demo: derive a checklist from the deterministic analysis.
  if (items.length === 0 && !isSupabaseConfigured) {
    items = mockAnalyzeClaim({ claim, documents: [] }).evidence_checklist.map(
      (e) => ({
        title: e.title,
        importance: e.importance,
        status: "missing" as const,
        ai_reason: e.reason,
        how_to_get_it: e.how_to_get_it,
      }),
    );
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <>
          {isSupabaseConfigured && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Evidence that strengthens your claim.
              </p>
              <RunAnalysisButton claimId={id} label="Regenerate checklist" />
            </div>
          )}
          <EvidenceChecklist items={items} />
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
              <ListChecks className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">Build your evidence checklist</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Run a full analysis to generate a tailored checklist of the proof
              that strengthens your claim.
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
