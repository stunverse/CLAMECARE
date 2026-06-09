import { Upload } from "lucide-react";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function DocumentsTab() {
  return (
    <div className="space-y-4">
      <ComingSoon
        icon={Upload}
        title="Documents"
        description="Securely upload and organize every document for this claim."
        bullets={[
          "Drag-and-drop upload of PDFs, images, and DOCX files",
          "Automatic classification and text extraction",
          "AI summaries with detected dates, amounts, and parties",
          "A private vault isolated to your account",
        ]}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
