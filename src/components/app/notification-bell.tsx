"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Notification bell (placeholder). Wired to the notifications table in a
 * later step (cahier des charges §29).
 */
export function NotificationBell({ count = 0 }: { count?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
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
          <div
            className={cn(
              "absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg",
            )}
          >
            <p className="text-sm font-medium">Notifications</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re all caught up. New deadlines, document, and analysis
              alerts will appear here.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
