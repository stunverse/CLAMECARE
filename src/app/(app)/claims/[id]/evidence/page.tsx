import { ListChecks } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function EvidenceTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={ListChecks}
        title="Evidence Checklist"
        description="A smart checklist of the proof that strengthens your claim."
        bullets={[
          "Recommended evidence by insurance type and denial reason",
          "Importance levels: critical, important, helpful, optional",
          "See clearly what's provided versus what's missing",
          "Guidance on how to obtain each document",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
