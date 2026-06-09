import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getComplaint } from "@/lib/data/complaints";
import {
  getStateRegulation,
  genericRegulatorName,
} from "@/lib/data/regulations";
import { isSupabaseConfigured } from "@/lib/env";
import { ComplaintAssistant } from "@/components/claim/complaint-assistant";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function ComplaintTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const [complaint, regulation] = await Promise.all([
    getComplaint(id),
    getStateRegulation(claim.state),
  ]);

  const regulatorName =
    regulation?.department_name || genericRegulatorName(claim.state);

  return (
    <div className="space-y-4">
      <DisclaimerBanner variant="complaint" />
      <ComplaintAssistant
        claimId={id}
        canPersist={isSupabaseConfigured}
        regulatorName={regulatorName}
        regulation={regulation}
        initialText={complaint?.complaint_text ?? ""}
        initialStatus={complaint?.status ?? "not_started"}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
