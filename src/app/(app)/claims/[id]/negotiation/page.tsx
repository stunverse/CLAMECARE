import { Scale } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function NegotiationTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={Scale}
        title="Negotiation"
        description="Respond to a low offer with confidence."
        bullets={[
          "Analysis of the amount claimed versus the amount offered",
          "A suggested counteroffer with supporting talking points",
          "Phone scripts and responses to common objections",
          "Guidance on when to escalate or consult an attorney",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
