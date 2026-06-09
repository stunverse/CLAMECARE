import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { ComingSoon } from "@/components/claim/coming-soon";

export const metadata: Metadata = { title: "Admin · Companies" };

export default async function AdminCompaniesPage() {
  await getAdminContext();
  return (
    <ComingSoon
      icon={Building2}
      title="Insurance company playbooks"
      description="Maintain per-company claim procedures, contacts, and escalation steps."
      bullets={[
        "Claims and appeals URLs and contacts",
        "Common denial reasons and recommended documents",
        "Escalation steps and internal notes",
      ]}
    />
  );
}
