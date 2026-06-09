import { ScrollText } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function PolicyTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={ScrollText}
        title="Policy Review"
        description="Understand what your policy actually covers."
        bullets={[
          "Detected coverages, exclusions, deductibles, and limits",
          "Deadlines and the appeal procedure in your policy",
          "Comparison against the denial reason",
          "Useful clauses and risky clauses highlighted",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
