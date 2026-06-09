import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getClaim } from "@/lib/data/claim";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function AnalysisTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  return (
    <div className="space-y-4">
      {claim.insurance_type === "health" && (
        <DisclaimerBanner variant="health" />
      )}
      <ComingSoon
        icon={Sparkles}
        title="AI Analysis"
        description="A clear, structured analysis of your claim and what to do next."
        bullets={[
          "Detected denial reason, explained in plain language",
          "Strengths, weaknesses, and risk flags",
          "Missing documents and key dates and amounts",
          "A recommended step-by-step strategy",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
