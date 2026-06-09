import { createClient } from "@/lib/supabase/server";
import { TIMELINE_EVENT_TYPE_LABELS } from "@/lib/labels";
import type { TimelineEntry } from "@/lib/timeline/types";
import type { Claim, TimelineEvent } from "@/lib/types";
import type { TimelineEventType } from "@/lib/types/enums";

/** Build seed events from the claim's known dates (used in demo / generation). */
export function deriveEventsFromClaim(claim: Claim): TimelineEntry[] {
  const map: { date: string | null; type: TimelineEventType }[] = [
    { date: claim.incident_date, type: "incident_occurred" },
    { date: claim.claim_filed_date, type: "claim_filed" },
    { date: claim.denial_date, type: "denial_received" },
  ];
  return map
    .filter((m) => m.date)
    .map((m) => ({
      id: `seed-${m.type}`,
      title: TIMELINE_EVENT_TYPE_LABELS[m.type],
      description: null,
      event_date: m.date,
      event_type: m.type,
    }));
}

/** Load timeline events for a claim. Demo derives from the claim's dates. */
export async function getClaimTimeline(
  claim: Claim,
): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  if (!supabase) return deriveEventsFromClaim(claim);

  const { data } = await supabase
    .from("timeline_events")
    .select("id, title, description, event_date, event_type")
    .eq("claim_id", claim.id)
    .order("event_date", { ascending: true, nullsFirst: false })
    .returns<TimelineEvent[]>();

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    event_date: e.event_date,
    event_type: e.event_type,
  }));
}
