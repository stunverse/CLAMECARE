import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimDocuments } from "@/lib/data/documents";
import { PolicyReview } from "@/components/claim/policy-review";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import type { PolicyAnalysisResult } from "@/lib/ai/policy";

const POLICY_CATEGORIES = ["insurance_policy", "policy_declaration", "contract"];

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

  // Pre-fill from text extracted out of any uploaded policy documents.
  const docs = await getClaimDocuments(id);
  const prefillText = docs
    .filter(
      (d) => POLICY_CATEGORIES.includes(d.document_category) && d.extracted_text,
    )
    .map((d) => d.extracted_text)
    .join("\n\n")
    .slice(0, 14000);

  return (
    <div className="space-y-4">
      <PolicyReview
        claimId={id}
        initialResult={initialResult}
        prefillText={prefillText}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
