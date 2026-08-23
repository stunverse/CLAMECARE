"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Mail } from "lucide-react";
import { sendCaseEmail } from "@/lib/cases/email-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CaseCompose({
  caseId,
  to,
  initialSubject,
  initialBody,
  kindLabel,
  emailConfigured,
}: {
  caseId: string;
  to: string | null;
  initialSubject: string;
  initialBody: string;
  kindLabel: string;
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await sendCaseEmail({ caseId, subject, body });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.notSent) {
        setNotice(
          "Message enregistré. L'envoi réel nécessite la configuration de l'email (Resend).",
        );
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!to) {
    return (
      <p className="text-sm text-muted-foreground">
        Renseignez l&apos;email de l&apos;organisme pour pouvoir le contacter.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="brand"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <Mail className="size-4" />
          {kindLabel}
        </Button>
        {!emailConfigured && (
          <p className="text-xs text-muted-foreground">
            Mode brouillon : l&apos;email sera préparé et enregistré (envoi réel
            à configurer).
          </p>
        )}
        {notice && <p className="text-xs text-info">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Destinataire : <span className="font-medium">{to}</span>. Relisez et
        modifiez avant l&apos;envoi.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="compose-subject">Objet</Label>
        <Input
          id="compose-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="compose-body">Message</Label>
        <Textarea
          id="compose-body"
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Annuler
        </Button>
        <Button type="button" variant="brand" onClick={submit} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Envoyer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
