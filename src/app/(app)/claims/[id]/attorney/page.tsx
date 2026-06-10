import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getAttorneyReferral } from "@/lib/data/attorney";
import { isSupabaseConfigured } from "@/lib/env";
import { mockAnalyzeClaim } from "@/lib/ai";
import type { AnalyzeClaimResult } from "@/lib/ai/types";
import { AttorneyPanel } from "@/components/claim/attorney-panel";

export default async function AttorneyTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const analysis =
    (claim.ai_analysis as unknown as AnalyzeClaimResult | null) ??
    mockAnalyzeClaim({ claim, documents: [] });

  const referral = await getAttorneyReferral(id);

  return (
    <AttorneyPanel
      claimId={id}
      recommendation={{
        should: analysis.should_consult_attorney,
        reasons: analysis.risk_flags,
      }}
      canPersist={isSupabaseConfigured}
      initialConsent={referral?.referral_status === "consent_given"}
      state={claim.state}
    />
  );
}
