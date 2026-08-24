"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerCaseDocument } from "@/lib/cases/documents";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CASE_DOCUMENT_CATEGORIES,
  CASE_DOCUMENT_CATEGORY_LABELS,
  type CaseDocumentCategory,
} from "@/lib/claimguard/enums";
import {
  ACCEPT_ATTR,
  MAX_FILE_SIZE,
  isAllowedMime,
  sanitizeFileName,
} from "@/lib/documents/constants";
import { cn } from "@/lib/utils";

type ItemStatus = "uploading" | "done" | "error";
interface UploadItem {
  id: string;
  name: string;
  status: ItemStatus;
  error?: string;
}

export function CaseDocumentUploader({
  caseId,
  userId,
  bucket,
}: {
  caseId: string;
  userId: string;
  bucket: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<CaseDocumentCategory>("invoice");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patch(id: string, next: Partial<UploadItem>) {
    setItems((list) =>
      list.map((it) => (it.id === id ? { ...it, ...next } : it)),
    );
  }

  async function uploadOne(file: File) {
    const itemId = crypto.randomUUID();
    setItems((list) => [
      { id: itemId, name: file.name, status: "uploading" },
      ...list,
    ]);

    if (!isAllowedMime(file.type)) {
      patch(itemId, { status: "error", error: "Type de fichier non autorisé" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      patch(itemId, { status: "error", error: "Dépasse 25 Mo" });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      patch(itemId, { status: "error", error: "Stockage non configuré" });
      return;
    }

    const path = `${userId}/cases/${caseId}/${crypto.randomUUID()}-${sanitizeFileName(
      file.name,
    )}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      patch(itemId, { status: "error", error: uploadError.message });
      return;
    }

    const result = await registerCaseDocument({
      case_id: caseId,
      file_name: file.name,
      file_path: path,
      mime_type: file.type,
      file_size: file.size,
      document_category: category,
    });

    if (result.error || !result.document) {
      patch(itemId, { status: "error", error: result.error ?? "Échec" });
      return;
    }

    patch(itemId, { status: "done" });
    router.refresh();
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadOne(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="case-doc-category">Type de document</Label>
        <Select
          id="case-doc-category"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as CaseDocumentCategory)
          }
          className="sm:w-72"
        >
          {CASE_DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CASE_DOCUMENT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-brand bg-accent"
            : "border-border hover:border-brand/60 hover:bg-accent/40",
        )}
      >
        <UploadCloud className="size-7 text-brand" />
        <span className="text-sm font-medium">
          Glissez-déposez vos fichiers, ou cliquez pour parcourir
        </span>
        <span className="text-xs text-muted-foreground">
          Facture, devis, contrat, bon de commande… · PDF, JPG, PNG, DOCX ·
          25 Mo max
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              {it.status === "uploading" && (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              )}
              {it.status === "done" && (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              )}
              {it.status === "error" && (
                <AlertCircle className="size-4 shrink-0 text-danger" />
              )}
              <span className="truncate">{it.name}</span>
              {it.error && (
                <span className="ml-auto shrink-0 text-xs text-danger">
                  {it.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
