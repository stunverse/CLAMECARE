import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimMessages } from "@/lib/data/messages";
import { isSupabaseConfigured } from "@/lib/env";
import { EmailAssistant } from "@/components/claim/email-assistant";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function MessagesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const messages = await getClaimMessages(id);

  return (
    <div className="space-y-4">
      <EmailAssistant
        claimId={id}
        canPersist={isSupabaseConfigured}
        initialMessages={messages}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
