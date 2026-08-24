"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, ShieldCheck, StickyNote, Send } from "lucide-react";
import {
  setCaseStatus,
  setAutomation,
  clearHumanReview,
  addAdminNote,
  sendManualCaseEmail,
} from "@/lib/admin/case-actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  type CaseStatus,
} from "@/lib/claimguard/enums";

export function AdminCaseActions({
  caseId,
  status,
  automationEnabled,
  humanReviewRequired,
}: {
  caseId: string;
  status: CaseStatus;
  automationEnabled: boolean;
  humanReviewRequired: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<CaseStatus>(status);
  const [note, setNote] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function act(fn: () => Promise<{ error?: string }>, ok?: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setMsg(res.error);
      else {
        if (ok) setMsg(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      {msg && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
          {msg}
        </p>
      )}

      {/* Status override */}
      <div className="space-y-2">
        <Label htmlFor="admin-status">Statut</Label>
        <div className="flex gap-2">
          <Select
            id="admin-status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
          >
            {CASE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CASE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || newStatus === status}
            onClick={() => act(() => setCaseStatus(caseId, newStatus), "Statut modifié.")}
          >
            Appliquer
          </Button>
        </div>
      </div>

      {/* Automation + review */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            act(
              () => setAutomation(caseId, !automationEnabled),
              automationEnabled ? "Automatisation suspendue." : "Automatisation reprise.",
            )
          }
        >
          {automationEnabled ? (
            <>
              <Pause className="size-4" /> Suspendre l&apos;automatisation
            </>
          ) : (
            <>
              <Play className="size-4" /> Reprendre l&apos;automatisation
            </>
          )}
        </Button>
        {humanReviewRequired && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(() => clearHumanReview(caseId), "Revue levée.")}
          >
            <ShieldCheck className="size-4" /> Lever la revue
          </Button>
        )}
      </div>

      {/* Internal note */}
      <div className="space-y-2">
        <Label htmlFor="admin-note">Note interne</Label>
        <Textarea
          id="admin-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Visible uniquement par le staff."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || !note.trim()}
          onClick={() =>
            act(async () => {
              const r = await addAdminNote(caseId, note);
              if (!r.error) setNote("");
              return r;
            }, "Note ajoutée.")
          }
        >
          <StickyNote className="size-4" /> Ajouter la note
        </Button>
      </div>

      {/* Manual email */}
      <div className="space-y-2">
        <Label htmlFor="admin-email-subject">Email manuel au client</Label>
        <Input
          id="admin-email-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Objet"
        />
        <Textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
        />
        <Button
          type="button"
          variant="brand"
          size="sm"
          disabled={pending || !subject.trim() || !body.trim()}
          onClick={() =>
            act(async () => {
              const r = await sendManualCaseEmail(caseId, subject, body);
              if (!r.error) {
                setSubject("");
                setBody("");
              }
              return r;
            }, "Email envoyé.")
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Envoyer
        </Button>
      </div>
    </div>
  );
}
