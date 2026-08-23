import { createClient } from "@/lib/supabase/server";
import type {
  Case,
  CaseDocument,
  CaseTimelineEntry,
  EmailMessage,
  Organization,
  PaymentPromise,
} from "@/lib/claimguard/types";
import { DEMO_CASES } from "@/lib/cases/demo";

export interface CaseListResult {
  cases: Case[];
  isDemo: boolean;
}

/** All cases owned by the signed-in user (most recently updated first). */
export async function getCases(): Promise<CaseListResult> {
  const supabase = await createClient();
  if (!supabase) return { cases: DEMO_CASES, isDemo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { cases: [], isDemo: false };

  const { data } = await supabase
    .from("cases")
    .select("*")
    .order("updated_at", { ascending: false });

  return { cases: (data as Case[] | null) ?? [], isDemo: false };
}

export interface CaseDetail {
  case: Case;
  organization: Organization | null;
  documents: CaseDocument[];
  timeline: CaseTimelineEntry[];
  promises: PaymentPromise[];
  messages: EmailMessage[];
  isDemo: boolean;
}

/**
 * Full case detail for the owner. RLS guarantees a user can only read their
 * own case, so a foreign id simply returns null (no cross-tenant leak).
 */
export async function getCase(id: string): Promise<CaseDetail | null> {
  const supabase = await createClient();
  if (!supabase) {
    const demo = DEMO_CASES.find((c) => c.id === id) ?? DEMO_CASES[0];
    if (!demo) return null;
    return {
      case: demo,
      organization: null,
      documents: [],
      timeline: [],
      promises: [],
      messages: [],
      isDemo: true,
    };
  }

  const { data: row } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle<Case>();
  if (!row) return null;

  const [orgRes, docsRes, timelineRes, promisesRes, messagesRes] =
    await Promise.all([
    row.organization_id
      ? supabase
          .from("organizations")
          .select("*")
          .eq("id", row.organization_id)
          .maybeSingle<Organization>()
      : Promise.resolve({ data: null }),
    supabase
      .from("case_documents")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("case_timeline")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_promises")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_messages")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    case: row,
    organization: (orgRes.data as Organization | null) ?? null,
    documents: (docsRes.data as CaseDocument[] | null) ?? [],
    timeline: (timelineRes.data as CaseTimelineEntry[] | null) ?? [],
    promises: (promisesRes.data as PaymentPromise[] | null) ?? [],
    messages: (messagesRes.data as EmailMessage[] | null) ?? [],
    isDemo: false,
  };
}
