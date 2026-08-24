import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  EMAIL_CATEGORY_LABELS,
  type EmailCategory,
} from "@/lib/claimguard/enums";
import { formatDateTimeFr } from "@/lib/cases/format";
import type { EmailMessage } from "@/lib/claimguard/types";

export function CaseEmails({ messages }: { messages: EmailMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun échange pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((m) => {
        const inbound = m.direction === "inbound";
        return (
          <li
            key={m.id}
            className={
              inbound
                ? "rounded-lg border border-border bg-muted/40 p-3"
                : "rounded-lg border border-brand/20 bg-brand/5 p-3"
            }
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                {inbound ? (
                  <>
                    <ArrowDownLeft className="size-3.5 text-info" />
                    {m.from_email ?? "Client"}
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="size-3.5 text-brand" />
                    Vous → {m.to_email ?? "Client"}
                  </>
                )}
              </span>
              <time className="text-[11px] text-muted-foreground">
                {formatDateTimeFr(m.sent_at ?? m.received_at ?? m.created_at)}
              </time>
            </div>
            {m.subject && (
              <p className="text-sm font-medium">{m.subject}</p>
            )}
            {m.body && (
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {m.body.length > 600 ? `${m.body.slice(0, 600)}…` : m.body}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {m.category && (
                <Badge variant="muted">
                  {EMAIL_CATEGORY_LABELS[m.category as EmailCategory]}
                </Badge>
              )}
              {m.requires_review && (
                <Badge variant="warning">À vérifier</Badge>
              )}
              {m.ai_generated && !inbound && (
                <Badge variant="info">Rédigé par IA</Badge>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
