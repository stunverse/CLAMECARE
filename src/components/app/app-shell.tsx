"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Plus } from "lucide-react";
import { AppNav } from "@/components/app/app-nav";
import { NotificationBell } from "@/components/app/notification-bell";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link href="/dossiers" className="flex items-center">
      <BrandLogo className="text-2xl" />
    </Link>
  );
}

import type { Notification } from "@/lib/types";

export function AppShell({
  user,
  notifications,
  unread,
  children,
}: {
  user: { name: string; email: string };
  notifications: Notification[];
  unread: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <div className="flex-1 px-3 py-2">
          <AppNav />
        </div>
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 px-3 py-2">
              <AppNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-4">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="md:hidden">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dossiers/nouveau"
              className={cn(buttonVariants({ variant: "brand", size: "sm" }))}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nouveau dossier</span>
            </Link>
            <NotificationBell notifications={notifications} unread={unread} />
          </div>
        </header>

        <main className="flex-1 bg-secondary/30">{children}</main>
      </div>
    </div>
  );
}
