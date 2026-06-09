import { Landmark } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function ComplaintTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={Landmark}
        title="Complaint"
        description="Prepare a complaint to your state Department of Insurance."
        bullets={[
          "Identify the right regulator for your state",
          "Auto-summarize the facts, key dates, and attachments",
          "Step-by-step filing instructions",
          "Track your complaint status to resolution",
        ]}
      />
      <DisclaimerBanner variant="complaint" />
    </div>
  );
}
