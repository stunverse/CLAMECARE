import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function LettersTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={FileText}
        title="Letters"
        description="Generate professional, ready-to-review letters in minutes."
        bullets={[
          "Appeal letters, reconsideration and demand letters, and more",
          "Choose a tone: professional, firm, conciliatory, or urgent",
          "Edit, preview, and export to PDF or DOCX",
          "Keep a version history of every letter",
        ]}
      />
      <DisclaimerBanner variant="letter" />
    </div>
  );
}
