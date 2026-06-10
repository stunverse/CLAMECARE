"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", segment: "" },
  { label: "AI Analysis", segment: "analysis" },
  { label: "Documents", segment: "documents" },
  { label: "Evidence", segment: "evidence" },
  { label: "Policy", segment: "policy" },
  { label: "Timeline", segment: "timeline" },
  { label: "Letters", segment: "letters" },
  { label: "Messages", segment: "messages" },
  { label: "Complaint", segment: "complaint" },
  { label: "Negotiation", segment: "negotiation" },
  { label: "Call Prep", segment: "call-prep" },
  { label: "Attorney", segment: "attorney" },
  { label: "AI Coach", segment: "coach" },
  { label: "Activity", segment: "activity" },
];

export function ClaimTabs({ claimId }: { claimId: string }) {
  const pathname = usePathname();
  const base = `/claims/${claimId}`;

  return (
    <div className="overflow-x-auto border-b border-border">
      <nav className="flex min-w-max gap-1 px-1">
        {TABS.map(({ label, segment }) => {
          const href = segment ? `${base}/${segment}` : base;
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
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
