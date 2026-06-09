import { MessageCircle } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function CoachTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={MessageCircle}
        title="AI Coach"
        description="Chat with an assistant that knows the details of your claim."
        bullets={[
          "Ask what to do next or why your claim was denied",
          "Draft responses to emails and prepare call scripts",
          "Get context-aware suggestions based on your file",
          "Quick prompts for the most common questions",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
