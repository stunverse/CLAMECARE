import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimLetters } from "@/lib/data/letters";
import { isSupabaseConfigured } from "@/lib/env";
import { LettersManager } from "@/components/documents/letters-manager";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function LettersTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const documents = await getClaimLetters(id);

  return (
    <div className="space-y-4">
      <DisclaimerBanner variant="letter" />
      <LettersManager
        claimId={id}
        canPersist={isSupabaseConfigured}
        initialDocuments={documents}
      />
    </div>
  );
}
