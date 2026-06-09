import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { getAdminContext } from "@/lib/admin/guard";
import { ComingSoon } from "@/components/claim/coming-soon";

export const metadata: Metadata = { title: "Admin · Support" };

export default async function AdminSupportPage() {
  await getAdminContext();
  return (
    <ComingSoon
      icon={LifeBuoy}
      title="Support tickets"
      description="Review and respond to user support tickets."
      bullets={[
        "Filter by status and priority",
        "Reply and update ticket status",
        "Link tickets to users and claims",
      ]}
    />
  );
}
