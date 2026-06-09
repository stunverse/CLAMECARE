import type { TimelineEventType } from "@/lib/types/enums";

export interface TimelineEntry {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_type: TimelineEventType | null;
}
