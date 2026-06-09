"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateTicketStatus } from "@/lib/support/actions";
import {
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_STATUS_VARIANT,
  PRIORITY_LABELS,
  PRIORITY_VARIANT,
} from "@/lib/labels";
import { SUPPORT_TICKET_STATUSES } from "@/lib/types/enums";
import { formatDate } from "@/lib/format";
import type { SupportTicket, SupportTicketStatus } from "@/lib/types";

export function AdminTickets({
  tickets,
  canEdit,
}: {
  tickets: SupportTicket[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function change(id: string, status: SupportTicketStatus) {
    startTransition(async () => {
      await updateTicketStatus({ id, status });
      router.refresh();
    });
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        No support tickets.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <Card key={t.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{t.subject}</p>
                <Badge variant={PRIORITY_VARIANT[t.priority]}>
                  {PRIORITY_LABELS[t.priority]}
                </Badge>
              </div>
              {t.message && (
                <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(t.created_at)}
              </p>
            </div>
            {canEdit ? (
              <Select
                value={t.status}
                onChange={(e) =>
                  change(t.id, e.target.value as SupportTicketStatus)
                }
                className="w-44"
              >
                {SUPPORT_TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SUPPORT_TICKET_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            ) : (
              <Badge variant={SUPPORT_TICKET_STATUS_VARIANT[t.status]}>
                {SUPPORT_TICKET_STATUS_LABELS[t.status]}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
