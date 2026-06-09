"use client";

import { useState, useTransition } from "react";
import {
  Phone,
  Sparkles,
  Loader2,
  Target,
  HelpCircle,
  ThumbsUp,
  Ban,
  ListChecks,
  Mail,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { generateCallScriptAction } from "@/lib/ai/call-script-actions";
import { addClaimNote } from "@/lib/claims/manage-actions";
import type { CallScript } from "@/lib/ai/call-script";

function ListBlock({
  icon: Icon,
  title,
  items,
  tone = "brand",
}: {
  icon: typeof Phone;
  title: string;
  items: string[];
  tone?: "brand" | "danger";
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 pb-2">
        <Icon className={`size-4 ${tone === "danger" ? "text-danger" : "text-brand"}`} />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                  tone === "danger" ? "bg-danger" : "bg-brand"
                }`}
              />
              {it}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function CallPrep({ claimId }: { claimId: string }) {
  const [script, setScript] = useState<CallScript | null>(null);
  const [generating, startGenerate] = useTransition();
  const [note, setNote] = useState("");
  const [savingNote, startSaveNote] = useTransition();
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteError, setNoteError] = useState<string>();

  function generate() {
    startGenerate(async () => {
      const res = await generateCallScriptAction(claimId);
      if (res.script) setScript(res.script);
    });
  }

  function saveNote() {
    setNoteError(undefined);
    startSaveNote(async () => {
      const res = await addClaimNote(claimId, note);
      if (res.error) {
        setNoteError(res.error);
        return;
      }
      setNote("");
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {!script ? (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
              <Phone className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">Prepare for your call</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Get a call objective, questions to ask, useful phrases, things to
              avoid, an in-call checklist, and a follow-up email.
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="brand" onClick={generate} disabled={generating}>
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {generating ? "Preparing…" : "Create call prep"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-brand" />
                Objective
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{script.objective}</p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Before the call
                </p>
                <p className="mt-1 text-muted-foreground">{script.summary}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock icon={HelpCircle} title="Questions to ask" items={script.questions} />
            <ListBlock icon={ListChecks} title="During the call" items={script.checklist} />
            <ListBlock icon={ThumbsUp} title="Useful phrases" items={script.useful_phrases} />
            <ListBlock icon={Ban} title="Phrases to avoid" items={script.phrases_to_avoid} tone="danger" />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-brand" />
                Follow-up email
              </CardTitle>
              <CopyButton text={script.recap_email} />
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                {script.recap_email}
              </pre>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Regenerate
            </Button>
          </div>
        </>
      )}

      {/* Notes after the call -> activity log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes after the call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Who you spoke to, what they said, deadlines, next steps…"
            className="min-h-24"
          />
          {noteError && <p className="text-sm text-danger">{noteError}</p>}
          <Button onClick={saveNote} disabled={savingNote || !note.trim()}>
            {savingNote ? (
              <Loader2 className="size-4 animate-spin" />
            ) : noteSaved ? (
              <Check className="size-4 text-success" />
            ) : null}
            {noteSaved ? "Saved to activity log" : "Save note"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
