"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Copy, Check, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  analyzeMessageAction,
  saveMessageAction,
} from "@/lib/messages/actions";
import {
  MESSAGE_RESPONSE_TYPES,
  MESSAGE_RESPONSE_TYPE_LABELS,
  type MessageAnalysis,
  type MessageResponseType,
} from "@/lib/ai/analyze-message";
import { DOCUMENT_TONES } from "@/lib/types/enums";
import { DOCUMENT_TONE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { DocumentTone, Message } from "@/lib/types";

export function EmailAssistant({
  claimId,
  canPersist,
  initialMessages,
}: {
  claimId: string;
  canPersist: boolean;
  initialMessages: Message[];
}) {
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<DocumentTone>("professional");
  const [responseType, setResponseType] =
    useState<MessageResponseType>("reply_to_denial");
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();

  function analyze() {
    setError(undefined);
    setSaved(false);
    startAnalyze(async () => {
      const res = await analyzeMessageAction({
        claimId,
        body,
        tone,
        responseType,
      });
      if (res.error || !res.analysis) {
        setError(res.error ?? "Could not analyze the message.");
        return;
      }
      setAnalysis(res.analysis);
      setReply(res.analysis.reply);
    });
  }

  function save() {
    if (!analysis) return;
    startSave(async () => {
      const res = await saveMessageAction({
        claimId,
        body,
        summary: analysis.summary,
        detected_requests: analysis.detected_requests,
        detected_deadlines: analysis.detected_deadlines,
        reply,
      });
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  function copy() {
    navigator.clipboard.writeText(reply).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="space-y-2">
            <Label htmlFor="email-body">Paste the email you received</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the insurer's email or letter here…"
              className="min-h-40"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resp-type">Response type</Label>
              <Select
                id="resp-type"
                value={responseType}
                onChange={(e) =>
                  setResponseType(e.target.value as MessageResponseType)
                }
              >
                {MESSAGE_RESPONSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MESSAGE_RESPONSE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp-tone">Tone</Label>
              <Select
                id="resp-tone"
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
          </div>
          <Button variant="brand" onClick={analyze} disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {analyzing ? "Analyzing…" : "Analyze & draft reply"}
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Summary
                </p>
                <p className="mt-1 text-sm">{analysis.summary}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Detected requests
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  {analysis.detected_requests.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Detected deadlines
                </p>
                {analysis.detected_deadlines.length ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {analysis.detected_deadlines.map((d, i) => (
                      <Badge key={i} variant="warning">
                        {d}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None detected.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Suggested reply
              </p>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-60 font-mono text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {canPersist && (
                  <Button onClick={save} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : saved ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {saved ? "Saved" : "Save to claim"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {initialMessages.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Saved messages</h3>
          <div className="space-y-2">
            {initialMessages
              .filter((m) => m.direction === "inbound")
              .map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {m.sender ?? "Insurer"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    {m.ai_summary && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {m.ai_summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
