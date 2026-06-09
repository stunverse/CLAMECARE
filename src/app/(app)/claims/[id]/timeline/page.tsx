import { CalendarClock } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function TimelineTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={CalendarClock}
        title="Timeline"
        description="A clear visual timeline of your claim."
        bullets={[
          "Dates auto-extracted from your documents",
          "Add, edit, and reorder events manually",
          "Deadline alerts and inconsistency detection",
          "Included in your final claim packet",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
