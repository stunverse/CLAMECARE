import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { CallPrep } from "@/components/claim/call-prep";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function CallPrepTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  return (
    <div className="space-y-4">
      <CallPrep claimId={id} />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
