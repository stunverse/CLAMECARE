import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { PolicyReview } from "@/components/claim/policy-review";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import type { PolicyAnalysisResult } from "@/lib/ai/policy";

export default async function PolicyTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const initialResult =
    (claim.policy_analysis as unknown as PolicyAnalysisResult | null) ?? null;

  return (
    <div className="space-y-4">
      <PolicyReview claimId={id} initialResult={initialResult} />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
