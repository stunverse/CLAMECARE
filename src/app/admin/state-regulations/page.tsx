import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { ComingSoon } from "@/components/claim/coming-soon";

export const metadata: Metadata = { title: "Admin · State regulations" };

export default async function AdminStateRegulationsPage() {
  await getAdminContext();
  return (
    <ComingSoon
      icon={Landmark}
      title="State regulations"
      description="Maintain Department of Insurance details and complaint guidance per state."
      bullets={[
        "Department name, complaint URL, phone, and address",
        "Claim-handling deadlines and complaint instructions",
        "Last-verified dates and official sources",
      ]}
    />
  );
}
