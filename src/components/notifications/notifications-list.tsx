"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications/actions";
import { Button } from "@/components/ui/button";
import { formatDateTimeFr } from "@/lib/cases/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationsList({
  notifications,
  unread,
}: {
  notifications: Notification[];
  unread: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }
  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <Bell className="size-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aucune notification pour l&apos;instant. MyDueGuard vous préviendra à
          chaque étape.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="size-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => {
          const inner = (
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.is_read ? "bg-transparent" : "bg-brand",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm",
                      n.is_read ? "font-medium" : "font-semibold",
                    )}
                  >
                    {n.title}
                  </p>
                  <time className="text-[11px] text-muted-foreground">
                    {formatDateTimeFr(n.created_at)}
                  </time>
                </div>
                {n.message && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {n.message}
                  </p>
                )}
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    markOne(n.id);
                  }}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Marquer comme lu"
                >
                  <Check className="size-4" />
                </button>
              )}
            </div>
          );

          const cls = cn(
            "block rounded-lg border p-3 transition-colors",
            n.is_read
              ? "border-border bg-card hover:bg-accent/30"
              : "border-brand/20 bg-brand/5 hover:bg-brand/10",
          );

          return (
            <li key={n.id}>
              {n.action_url ? (
                <Link
                  href={n.action_url}
                  className={cls}
                  onClick={() => {
                    if (!n.is_read) markOne(n.id);
                  }}
                >
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
