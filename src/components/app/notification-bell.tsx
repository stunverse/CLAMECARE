"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications/actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationBell({
  notifications,
  unread,
}: {
  notifications: Notification[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }
  function onItemClick(n: Notification) {
    setOpen(false);
    if (!n.is_read) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-medium">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="text-xs text-brand hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {notifications.map((n) => {
                  const inner = (
                    <div
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/60",
                        !n.is_read && "bg-accent/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          n.is_read ? "bg-transparent" : "bg-brand",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground">
                            {n.message}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatDate(n.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.action_url ? (
                        <Link
                          href={n.action_url}
                          onClick={() => onItemClick(n)}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="block w-full text-left"
                          onClick={() => onItemClick(n)}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-border px-4 py-2 text-center">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3" />
                Deadline, document, and analysis alerts appear here
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
