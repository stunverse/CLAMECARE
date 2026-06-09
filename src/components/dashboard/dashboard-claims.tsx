"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
import Link from "next/link";
import { ClaimCard } from "@/components/claim-card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import {
  CLAIM_STATUS_LABELS,
  INSURANCE_TYPE_LABELS,
} from "@/lib/labels";
import { daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CLAIM_STATUSES, INSURANCE_TYPES } from "@/lib/types/enums";
import type { Claim } from "@/lib/types";

type SortKey = "urgent" | "newest" | "lowest_score" | "highest_amount";

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

export function DashboardClaims({ claims }: { claims: Claim[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [company, setCompany] = useState("all");
  const [sort, setSort] = useState<SortKey>("urgent");

  const companies = useMemo(
    () =>
      Array.from(
        new Set(claims.map((c) => c.insurance_company).filter(Boolean)),
      ) as string[],
    [claims],
  );

  const visible = useMemo(() => {
    const filtered = claims.filter((c) => {
      if (status !== "all" && c.current_status !== status) return false;
      if (type !== "all" && c.insurance_type !== type) return false;
      if (company !== "all" && c.insurance_company !== company) return false;
      if (query) {
        const haystack =
          `${c.claim_title} ${c.insurance_company ?? ""}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.created_at.localeCompare(a.created_at);
        case "lowest_score":
          return (a.success_score ?? 101) - (b.success_score ?? 101);
        case "highest_amount":
          return (b.amount_claimed ?? -1) - (a.amount_claimed ?? -1);
        case "urgent":
        default: {
          const pw =
            PRIORITY_WEIGHT[b.priority_level] - PRIORITY_WEIGHT[a.priority_level];
          if (pw !== 0) return pw;
          const da = daysUntil(a.appeal_deadline) ?? Number.POSITIVE_INFINITY;
          const db = daysUntil(b.appeal_deadline) ?? Number.POSITIVE_INFINITY;
          return da - db;
        }
      }
    });
    return sorted;
  }, [claims, status, type, company, query, sort]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search claims…"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {CLAIM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CLAIM_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="sm:w-40"
          aria-label="Filter by insurance type"
        >
          <option value="all">All types</option>
          {INSURANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {INSURANCE_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        {companies.length > 0 && (
          <Select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="sm:w-40"
            aria-label="Filter by company"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="sm:w-44"
          aria-label="Sort claims"
        >
          <option value="urgent">Most urgent</option>
          <option value="newest">Newest</option>
          <option value="lowest_score">Lowest score</option>
          <option value="highest_amount">Highest amount</option>
        </Select>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        claims.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No claims yet"
            description="Start your first claim review and let ClaimCare AI analyze your denial."
            action={
              <Link
                href="/claims/new"
                className={cn(buttonVariants({ variant: "brand" }))}
              >
                Start a claim
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No claims match your filters"
            description="Try adjusting your search or filters."
          />
        )
      ) : (
        <div className="grid gap-3">
          {visible.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
}
