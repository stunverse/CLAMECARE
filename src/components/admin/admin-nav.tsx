"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Claims", href: "/admin/claims" },
  { label: "Library", href: "/admin/library" },
  { label: "Knowledge base", href: "/admin/knowledge-base" },
  { label: "Companies", href: "/admin/insurance-companies" },
  { label: "State regulations", href: "/admin/state-regulations" },
  { label: "Support", href: "/admin/support" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto border-b border-border">
      <nav className="mx-auto flex min-w-max max-w-7xl gap-1 px-4 md:px-6">
        {ITEMS.map(({ label, href }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
