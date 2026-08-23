"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";
import {
  deleteCaseDocument,
  getCaseDocumentSignedUrl,
} from "@/lib/cases/documents";
import { CASE_DOCUMENT_CATEGORY_LABELS } from "@/lib/claimguard/enums";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/format";
import type { CaseDocument } from "@/lib/claimguard/types";

export function CaseDocuments({ documents }: { documents: CaseDocument[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function open(id: string) {
    setBusy(id);
    const { url, error } = await getCaseDocumentSignedUrl(id);
    setBusy(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else if (error) alert(error);
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    setBusy(id);
    startTransition(async () => {
      await deleteCaseDocument(id);
      setBusy(null);
      router.refresh();
    });
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun document pour l&apos;instant. Ajoutez au minimum la facture.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
        >
          <FileText className="size-4 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(doc.file_size)}
            </p>
          </div>
          <Badge variant="muted">
            {CASE_DOCUMENT_CATEGORY_LABELS[doc.document_category]}
          </Badge>
          <button
            type="button"
            onClick={() => open(doc.id)}
            disabled={busy === doc.id}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="Ouvrir"
          >
            {busy === doc.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => remove(doc.id)}
            disabled={busy === doc.id}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
