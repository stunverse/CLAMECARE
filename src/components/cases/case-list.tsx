"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CaseCard } from "@/components/cases/case-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/format";
import type { Case } from "@/lib/claimguard/types";

type FilterKey = "all" | "waiting" | "promised" | "overdue" | "settled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "waiting", label: "En attente" },
  { key: "promised", label: "Promesses" },
  { key: "overdue", label: "En retard" },
  { key: "settled", label: "Réglés" },
];

function matchesFilter(c: Case, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "settled":
      return c.status === "paid" || c.status === "closed";
    case "promised":
      return c.status === "payment_promised";
    case "overdue": {
      if (c.status === "payment_overdue") return true;
      // Also count active cases already past their due date.
      if (["paid", "closed", "cancelled"].includes(c.status)) return false;
      const d = daysUntil(c.due_date);
      return d !== null && d < 0;
    }
    case "waiting":
      return !["paid", "closed", "cancelled"].includes(c.status);
    default:
      return true;
  }
}

export function CaseList({
  cases,
  initialQuery = "",
}: {
  cases: Case[];
  initialQuery?: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState(initialQuery);

  const counts = useMemo(() => {
    const map = {} as Record<FilterKey, number>;
    for (const f of FILTERS) {
      map[f.key] = cases.filter((c) => matchesFilter(c, f.key)).length;
    }
    return map;
  }, [cases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (!matchesFilter(c, filter)) return false;
      if (!q) return true;
      return [c.debtor_name, c.invoice_number, c.case_reference, c.service_description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [cases, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="ml-1 text-[10px] opacity-70">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, une facture…"
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucun dossier ne correspond.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <CaseCard key={c.id} case={c} />
          ))}
        </div>
      )}
    </div>
  );
}
