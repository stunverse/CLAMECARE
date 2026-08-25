"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/auth/form-message";
import { EmptyState } from "@/components/empty-state";
import { LifeBuoy } from "lucide-react";
import { createSupportTicket } from "@/lib/support/actions";
import {
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_STATUS_VARIANT,
  PRIORITY_LABELS,
} from "@/lib/labels";
import { PRIORITY_LEVELS } from "@/lib/types/enums";
import { formatDateFr } from "@/lib/cases/format";
import type { PriorityLevel, SupportTicket } from "@/lib/types";

export function SupportClient({
  initialTickets,
  canSubmit,
}: {
  initialTickets: SupportTicket[];
  canSubmit: boolean;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const res = await createSupportTicket({ subject, message, priority });
      if (res.error || !res.ticket) {
        setError(res.error ?? "Envoi impossible.");
        return;
      }
      setTickets((t) => [res.ticket!, ...t]);
      setSubject("");
      setMessage("");
      setSuccess("Votre demande a été envoyée. Nous vous répondrons par email.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacter le support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Comment pouvons-nous vous aider ?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre question ou votre problème…"
              className="min-h-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="sm:w-48"
            >
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <FormMessage error={error} success={success} />
          <Button onClick={submit} disabled={pending || !canSubmit}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Envoyer la demande
          </Button>
          {!canSubmit && (
            <p className="text-xs text-muted-foreground">
              Connectez Supabase pour envoyer et suivre vos demandes.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Vos demandes</h2>
        {tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="Aucune demande"
            description="Vos demandes de support et leur statut apparaîtront ici."
          />
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{t.subject}</p>
                    <Badge variant={SUPPORT_TICKET_STATUS_VARIANT[t.status]}>
                      {SUPPORT_TICKET_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                  {t.message && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {t.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateFr(t.created_at)} · priorité {PRIORITY_LABELS[t.priority]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
