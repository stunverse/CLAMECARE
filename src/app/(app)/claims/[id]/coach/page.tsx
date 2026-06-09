import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimChat } from "@/lib/data/chat";
import { AIChatCoach } from "@/components/claim/ai-chat-coach";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function CoachTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const history = await getClaimChat(id);

  return (
    <div className="space-y-4">
      <AIChatCoach claimId={id} initialMessages={history} />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
