"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { ClaimDocument } from "@/lib/types";

export function DocumentsManager({
  claimId,
  userId,
  bucket,
  canUpload,
  initialDocuments,
}: {
  claimId: string;
  userId: string;
  bucket: string;
  canUpload: boolean;
  initialDocuments: ClaimDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);

  return (
    <div className="space-y-5">
      {canUpload ? (
        <Card>
          <CardContent className="p-5">
            <DocumentUploader
              claimId={claimId}
              userId={userId}
              bucket={bucket}
              onUploaded={(doc) => setDocuments((d) => [doc, ...d])}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Connect Supabase to securely upload and store your documents.
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold">
          Documents ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            description="Upload your denial letter, policy, photos, and any evidence to build your case."
          />
        ) : (
          <DocumentList
            documents={documents}
            onDeleted={(id) =>
              setDocuments((d) => d.filter((doc) => doc.id !== id))
            }
          />
        )}
      </div>
    </div>
  );
}
