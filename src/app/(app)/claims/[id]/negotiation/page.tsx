import { notFound } from "next/navigation";
import { Scale } from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { isSupabaseConfigured } from "@/lib/env";
import {
  mockGenerateNegotiation,
  type NegotiationResult,
} from "@/lib/ai/negotiation";
import { NegotiationView } from "@/components/claim/negotiation-view";
import { RunNegotiationButton } from "@/components/claim/run-negotiation-button";
import { Card, CardContent } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function NegotiationTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const persisted =
    claim.negotiation_analysis as unknown as NegotiationResult | null;
  const result: NegotiationResult | null =
    persisted ?? (!isSupabaseConfigured ? mockGenerateNegotiation(claim) : null);

  return (
    <div className="space-y-4">
      {result ? (
        <>
          {isSupabaseConfigured ? (
            <div className="flex justify-end">
              <RunNegotiationButton claimId={id} label="Re-run" />
            </div>
          ) : (
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
              Demo strategy based on this claim&apos;s amounts. Connect Supabase
              to save it.
            </div>
          )}
          <NegotiationView result={result} />
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
              <Scale className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">
              Build your negotiation strategy
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Get an assessment of the offer, a suggested counteroffer, talking
              points, a phone script, and responses to common objections.
            </p>
            <div className="mt-5 flex justify-center">
              <RunNegotiationButton claimId={id} />
            </div>
          </CardContent>
        </Card>
      )}

      <DisclaimerBanner variant="primary" />
    </div>
  );
}
