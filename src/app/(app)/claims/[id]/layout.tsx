import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { ClaimHeader } from "@/components/claim/claim-header";
import { ClaimTabs } from "@/components/claim/claim-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const claim = await getClaim(id);
  return { title: claim?.claim_title ?? "Claim" };
}

export default async function ClaimLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  return (
    <div>
      <ClaimHeader claim={claim} />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <ClaimTabs claimId={claim.id} />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        {children}
      </div>
    </div>
  );
}
