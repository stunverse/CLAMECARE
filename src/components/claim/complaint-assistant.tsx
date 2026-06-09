"use client";

import { useState, useTransition } from "react";
import {
  Landmark,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Printer,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  generateComplaintAction,
  saveComplaintAction,
  updateComplaintStatusAction,
} from "@/lib/complaints/actions";
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_VARIANT,
} from "@/lib/labels";
import { COMPLAINT_STATUSES } from "@/lib/types/enums";
import type { ComplaintStatus, StateRegulation } from "@/lib/types";

function printText(title: string, body: string) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.write(
    `<!doctype html><html><head><title>${esc(title)}</title><style>@page{margin:1in}body{font-family:Georgia,serif;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit;font-size:12pt}</style></head><body><pre>${esc(body)}</pre><script>window.onload=function(){window.print()}</script></body></html>`,
  );
  w.document.close();
}

export function ComplaintAssistant({
  claimId,
  canPersist,
  regulatorName,
  regulation,
  initialText,
  initialStatus,
}: {
  claimId: string;
  canPersist: boolean;
  regulatorName: string;
  regulation: StateRegulation | null;
  initialText: string;
  initialStatus: ComplaintStatus;
}) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<ComplaintStatus>(initialStatus);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  function generate() {
    startGenerate(async () => {
      const res = await generateComplaintAction(claimId);
      if (res.text) {
        setText(res.text);
        if (canPersist) setStatus("draft_prepared");
      }
    });
  }
  function save() {
    startSave(async () => {
      await saveComplaintAction({ claimId, text });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }
  function changeStatus(s: ComplaintStatus) {
    setStatus(s);
    if (canPersist) {
      startSave(async () => {
        await updateComplaintStatusAction({ claimId, status: s });
      });
    }
  }
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Regulator + status */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-3">
            <Landmark className="size-4 text-brand" />
            <CardTitle className="text-base">Where to file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{regulatorName}</p>
            {regulation ? (
              <div className="space-y-1 text-muted-foreground">
                {regulation.complaint_url && (
                  <a
                    href={regulation.complaint_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    File a complaint <ExternalLink className="size-3.5" />
                  </a>
                )}
                {regulation.phone && <p>Phone: {regulation.phone}</p>}
                {regulation.email && <p>Email: {regulation.email}</p>}
                {regulation.mailing_address && (
                  <p>{regulation.mailing_address}</p>
                )}
                {regulation.complaint_instructions && (
                  <p className="pt-1">{regulation.complaint_instructions}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                We don&apos;t have verified contact details for this regulator on
                file. Search for your state Department of Insurance to confirm
                where and how to file.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              Status
              <Badge variant={COMPLAINT_STATUS_VARIANT[status]}>
                {COMPLAINT_STATUS_LABELS[status]}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={status}
              onChange={(e) => changeStatus(e.target.value as ComplaintStatus)}
            >
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {COMPLAINT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Complaint text */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Complaint draft</CardTitle>
              <Button
                variant="brand"
                size="sm"
                onClick={generate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {text ? "Regenerate" : "Generate complaint"}
              </Button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Click “Generate complaint” to draft a complaint to your state Department of Insurance."
              className="min-h-[26rem] w-full rounded-lg border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {text && (
              <div className="flex flex-wrap gap-2">
                {canPersist && (
                  <Button onClick={save} disabled={saving}>
                    {saved ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {saved ? "Saved" : "Save"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => printText("Complaint", text)}
                >
                  <Printer className="size-4" />
                  Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
