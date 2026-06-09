import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimTimeline } from "@/lib/data/timeline";
import { isSupabaseConfigured } from "@/lib/env";
import { TimelineManager } from "@/components/claim/timeline-manager";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function TimelineTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const events = await getClaimTimeline(claim);

  return (
    <div className="space-y-4">
      <TimelineManager
        claimId={id}
        canPersist={isSupabaseConfigured}
        initialEvents={events}
        appealDeadline={claim.appeal_deadline}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
