"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  Printer,
  Copy,
  Trash2,
  Check,
  FileDown,
} from "lucide-react";
import { exportDocx } from "@/lib/docx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  generateLetterAction,
  previewLetterAction,
  saveLetterAction,
  deleteLetterAction,
} from "@/lib/documents/letter-actions";
import {
  GENERATED_DOCUMENT_TYPE_LABELS,
  DOCUMENT_TONE_LABELS,
  LETTER_DOCUMENT_TYPES,
} from "@/lib/labels";
import { DOCUMENT_TONES } from "@/lib/types/enums";
import { formatDate } from "@/lib/format";
import type {
  GeneratedDocument,
  GeneratedDocumentType,
  DocumentTone,
} from "@/lib/types";

function printLetter(title: string, body: string) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title>
    <style>
      @page { margin: 1in; }
      body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.5; }
      pre { white-space: pre-wrap; font-family: inherit; font-size: 12pt; }
    </style></head><body><pre>${esc(body)}</pre>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
  w.document.close();
}

interface DraftState {
  id: string | null; // null = unsaved demo/preview
  title: string;
  content: string;
}

export function LettersManager({
  claimId,
  canPersist,
  initialDocuments,
}: {
  claimId: string;
  canPersist: boolean;
  initialDocuments: GeneratedDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [docType, setDocType] =
    useState<GeneratedDocumentType>("appeal_letter");
  const [tone, setTone] = useState<DocumentTone>("professional");
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  function generate() {
    setError(undefined);
    startGenerate(async () => {
      if (canPersist) {
        const res = await generateLetterAction({
          claimId,
          documentType: docType,
          tone,
        });
        if (res.error || !res.document) {
          setError(res.error ?? "Failed to generate.");
          return;
        }
        setDocuments((d) => [res.document!, ...d]);
        setDraft({
          id: res.document.id,
          title: res.document.title,
          content: res.document.content ?? "",
        });
      } else {
        const res = await previewLetterAction({
          claimId,
          documentType: docType,
          tone,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
        setDraft({
          id: null,
          title: res.subject ?? "Letter",
          content: res.body ?? "",
        });
      }
    });
  }

  function select(doc: GeneratedDocument) {
    setDraft({ id: doc.id, title: doc.title, content: doc.content ?? "" });
  }

  function save() {
    if (!draft?.id) return;
    startSave(async () => {
      const res = await saveLetterAction({
        id: draft.id!,
        title: draft.title,
        content: draft.content,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setDocuments((d) =>
        d.map((x) =>
          x.id === draft.id
            ? { ...x, title: draft.title, content: draft.content }
            : x,
        ),
      );
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this letter? This cannot be undone.")) return;
    startSave(async () => {
      await deleteLetterAction(id);
      setDocuments((d) => d.filter((x) => x.id !== id));
      if (draft?.id === id) setDraft(null);
    });
  }

  function copy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Left: generator + list */}
      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="space-y-2">
              <Label htmlFor="letter-type">Letter type</Label>
              <Select
                id="letter-type"
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as GeneratedDocumentType)
                }
              >
                {LETTER_DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {GENERATED_DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="letter-tone">Tone</Label>
              <Select
                id="letter-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as DocumentTone)}
              >
                {DOCUMENT_TONES.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TONE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="brand"
              className="w-full"
              onClick={generate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {generating ? "Generating…" : "Generate letter"}
            </Button>
            {!canPersist && (
              <p className="text-xs text-muted-foreground">
                Demo mode: generated letters are previewed but not saved.
              </p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </CardContent>
        </Card>

        {documents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Saved letters</h3>
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => select(doc)}
                className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                  draft?.id === doc.id
                    ? "border-brand bg-accent"
                    : "border-border hover:bg-accent/60"
                }`}
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {doc.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(doc.created_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: editor */}
      <div className="lg:col-span-2">
        {draft ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className="max-w-md font-medium"
                />
                {draft.id === null && <Badge variant="muted">Not saved</Badge>}
              </div>
              <textarea
                value={draft.content}
                onChange={(e) =>
                  setDraft({ ...draft, content: e.target.value })
                }
                className="min-h-[28rem] w-full rounded-lg border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-2">
                {draft.id && (
                  <Button onClick={save} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => printLetter(draft.title, draft.content)}
                >
                  <Printer className="size-4" />
                  Print / Save as PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportDocx(draft.title, draft.content)}
                >
                  <FileDown className="size-4" />
                  DOCX
                </Button>
                <Button variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {draft.id && (
                  <Button
                    variant="ghost"
                    onClick={() => remove(draft.id!)}
                    className="ml-auto text-danger"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={FileText}
            title="No letter selected"
            description="Generate a new letter or pick one from your saved letters to preview and edit it."
          />
        )}
      </div>
    </div>
  );
}
