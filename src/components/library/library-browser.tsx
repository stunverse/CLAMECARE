"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Lock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  INSURANCE_TYPE_LABELS,
} from "@/lib/labels";
import { KNOWLEDGE_CATEGORIES } from "@/lib/types/enums";
import type { ClaimLibraryItem } from "@/lib/types";

export function LibraryBrowser({ items }: { items: ClaimLibraryItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const visible = useMemo(() => {
    return items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (query) {
        const hay = `${it.title} ${it.content ?? ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library…"
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-56"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {KNOWLEDGE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          description="Try a different search or category."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((it) => (
            <Link key={it.id} href={`/library/${it.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    {it.category && (
                      <Badge variant="secondary">
                        {KNOWLEDGE_CATEGORY_LABELS[it.category]}
                      </Badge>
                    )}
                    {it.is_premium && (
                      <Badge variant="warning">
                        <Lock className="size-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold">{it.title}</h3>
                  {it.content && (
                    <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {it.content}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {it.insurance_type && (
                      <Badge variant="muted">
                        {INSURANCE_TYPE_LABELS[it.insurance_type]}
                      </Badge>
                    )}
                    {it.state && <Badge variant="muted">{it.state}</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
