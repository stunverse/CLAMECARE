"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClaim } from "@/lib/data/claim";
import { deriveEventsFromClaim } from "@/lib/data/timeline";
import { TIMELINE_EVENT_TYPES } from "@/lib/types/enums";
import type { TimelineEntry } from "@/lib/timeline/types";
import type { TimelineEventType } from "@/lib/types/enums";

export interface TimelineInput {
  title: string;
  description: string | null;
  event_date: string | null;
  event_type: TimelineEventType | null;
}

function rowToEntry(r: {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_type: TimelineEventType | null;
}): TimelineEntry {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    event_date: r.event_date,
    event_type: r.event_type,
  };
}

function validate(input: TimelineInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (input.event_type && !TIMELINE_EVENT_TYPES.includes(input.event_type)) {
    return "Invalid event type.";
  }
  return null;
}

export async function addTimelineEvent(
  claimId: string,
  input: TimelineInput,
): Promise<{ error?: string; event?: TimelineEntry }> {
  const err = validate(input);
  if (err) return { error: err };

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to save events." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("timeline_events")
    .insert({
      claim_id: claimId,
      title: input.title.trim(),
      description: input.description,
      event_date: input.event_date,
      event_type: input.event_type,
      created_by: user.id,
    })
    .select("id, title, description, event_date, event_type")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not add event." };
  revalidatePath(`/claims/${claimId}/timeline`);
  return { event: rowToEntry(data) };
}

export async function updateTimelineEvent(
  id: string,
  input: TimelineInput,
): Promise<{ error?: string; event?: TimelineEntry }> {
  const err = validate(input);
  if (err) return { error: err };

  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to edit events." };

  const { data, error } = await supabase
    .from("timeline_events")
    .update({
      title: input.title.trim(),
      description: input.description,
      event_date: input.event_date,
      event_type: input.event_type,
    })
    .eq("id", id)
    .select("id, title, description, event_date, event_type")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not update." };
  return { event: rowToEntry(data) };
}

export async function deleteTimelineEvent(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to delete events." };

  const { error } = await supabase.from("timeline_events").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Insert events from the claim's known dates, skipping types already present. */
export async function generateTimelineFromClaim(
  claimId: string,
): Promise<{ error?: string; events?: TimelineEntry[] }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Connect Supabase to generate events." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const claim = await getClaim(claimId);
  if (!claim) return { error: "Claim not found." };

  const { data: existing } = await supabase
    .from("timeline_events")
    .select("event_type")
    .eq("claim_id", claimId)
    .returns<{ event_type: TimelineEventType | null }[]>();
  const presentTypes = new Set((existing ?? []).map((e) => e.event_type));

  const toInsert = deriveEventsFromClaim(claim).filter(
    (e) => !presentTypes.has(e.event_type),
  );
  if (toInsert.length === 0) return { events: [] };

  const { data, error } = await supabase
    .from("timeline_events")
    .insert(
      toInsert.map((e) => ({
        claim_id: claimId,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        event_type: e.event_type,
        created_by: user.id,
      })),
    )
    .select("id, title, description, event_date, event_type");

  if (error) return { error: error.message };
  revalidatePath(`/claims/${claimId}/timeline`);
  return { events: (data ?? []).map(rowToEntry) };
}
