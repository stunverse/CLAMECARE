import { createClient } from "@/lib/supabase/server";
import { isActiveClaim } from "@/lib/claim-actions";
import { daysUntil } from "@/lib/format";
import {
  DEMO_CLAIMS,
  DEMO_RECENT_DOCUMENTS,
  type RecentDocument,
} from "@/lib/data/demo";
import type { Claim } from "@/lib/types";

export interface DashboardData {
  isDemo: boolean;
  claims: Claim[];
  recentDocuments: RecentDocument[];
  stats: {
    activeClaims: number;
    resolvedClaims: number;
    documentsGenerated: number;
    urgentActions: number;
  };
}

function computeStats(claims: Claim[], documentsGenerated: number) {
  let activeClaims = 0;
  let resolvedClaims = 0;
  let urgentActions = 0;

  for (const c of claims) {
    if (c.current_status === "resolved") resolvedClaims++;
    if (isActiveClaim(c.current_status)) activeClaims++;

    const days = daysUntil(c.appeal_deadline);
    const deadlineUrgent = days !== null && days <= 5;
    if (
      isActiveClaim(c.current_status) &&
      (c.priority_level === "urgent" || deadlineUrgent)
    ) {
      urgentActions++;
    }
  }

  return { activeClaims, resolvedClaims, documentsGenerated, urgentActions };
}

/**
 * Load everything the dashboard needs. Falls back to demo data when Supabase
 * is not configured or no session is present.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      isDemo: true,
      claims: DEMO_CLAIMS,
      recentDocuments: DEMO_RECENT_DOCUMENTS,
      stats: computeStats(DEMO_CLAIMS, DEMO_RECENT_DOCUMENTS.length),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      isDemo: true,
      claims: DEMO_CLAIMS,
      recentDocuments: DEMO_RECENT_DOCUMENTS,
      stats: computeStats(DEMO_CLAIMS, DEMO_RECENT_DOCUMENTS.length),
    };
  }

  const [{ data: claims }, { data: docs }, { count: docCount }] =
    await Promise.all([
      supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<Claim[]>(),
      supabase
        .from("generated_documents")
        .select("id,title,claim_id,created_at")
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<RecentDocument[]>(),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true }),
    ]);

  const claimList = claims ?? [];

  return {
    isDemo: false,
    claims: claimList,
    recentDocuments: docs ?? [],
    stats: computeStats(claimList, docCount ?? 0),
  };
}
