import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { isSupabaseConfigured } from "@/lib/env";
import { EditClaimForm } from "@/components/claim/edit-claim-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Edit claim details</h1>
      {isSupabaseConfigured ? (
        <EditClaimForm claim={claim} />
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Connect Supabase to edit this claim.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
