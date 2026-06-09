import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getClaimDocuments } from "@/lib/data/documents";
import { DEFAULT_BUCKET } from "@/lib/documents/constants";
import { DocumentsManager } from "@/components/documents/documents-manager";
import { ComingSoon } from "@/components/claim/coming-soon";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function DocumentsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Placeholder mode: show the feature preview instead of a broken uploader.
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <ComingSoon
          icon={Upload}
          title="Documents"
          description="Securely upload and organize every document for this claim."
          bullets={[
            "Drag-and-drop upload of PDFs, images, and DOCX files",
            "A private vault isolated to your account",
            "AI classification and text extraction (next)",
          ]}
        >
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
            Connect Supabase to enable secure document upload.
          </div>
        </ComingSoon>
        <DisclaimerBanner variant="primary" />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase!.auth.getUser()) ?? { data: { user: null } };

  const documents = await getClaimDocuments(id);
  const bucket = env.STORAGE_BUCKET_CLAIM_DOCUMENTS || DEFAULT_BUCKET;

  return (
    <div className="space-y-4">
      <DocumentsManager
        claimId={id}
        userId={user?.id ?? ""}
        bucket={bucket}
        canUpload={Boolean(user)}
        initialDocuments={documents}
      />
      <DisclaimerBanner variant="primary" />
    </div>
  );
}
