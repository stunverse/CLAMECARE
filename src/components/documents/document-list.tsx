"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDocumentSignedUrl,
  deleteDocument,
} from "@/lib/documents/actions";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { formatDate, formatFileSize } from "@/lib/format";
import type { AnalysisStatus, ClaimDocument } from "@/lib/types";
import type { StatusVariant } from "@/lib/labels";

const STATUS_META: Record<
  AnalysisStatus,
  { label: string; variant: StatusVariant }
> = {
  uploaded: { label: "Uploaded", variant: "muted" },
  processing: { label: "Processing", variant: "info" },
  analyzed: { label: "Analyzed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

function DocRow({
  doc,
  onDeleted,
}: {
  doc: ClaimDocument;
  onDeleted: (id: string) => void;
}) {
  const [opening, setOpening] = useState(false);
  const [pending, startTransition] = useTransition();
  const isImage = doc.mime_type?.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  const status = STATUS_META[doc.analysis_status];

  async function open() {
    setOpening(true);
    const { url } = await getDocumentSignedUrl(doc.id);
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function remove() {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const { error } = await deleteDocument(doc.id);
      if (!error) onDeleted(doc.id);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.file_name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{DOCUMENT_CATEGORY_LABELS[doc.document_category]}</span>
          <span>· {formatFileSize(doc.file_size)}</span>
          <span>· {formatDate(doc.created_at)}</span>
        </div>
        {doc.ai_summary && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {doc.ai_summary}
          </p>
        )}
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
      <Button variant="ghost" size="sm" onClick={open} disabled={opening}>
        {opening ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ExternalLink className="size-4" />
        )}
        <span className="hidden sm:inline">View</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        aria-label="Delete document"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4 text-danger" />
        )}
      </Button>
    </div>
  );
}

export function DocumentList({
  documents,
  onDeleted,
}: {
  documents: ClaimDocument[];
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocRow key={doc.id} doc={doc} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
