import { History } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function ActivityTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={History}
        title="Activity Log"
        description="Every action taken on this claim, in one place."
        bullets={[
          "Uploads, AI analyses, and generated documents",
          "Status changes and your own notes",
          "AI notes and recommendations",
          "A complete, timestamped audit trail",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
