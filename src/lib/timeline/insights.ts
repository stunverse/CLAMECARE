import { daysUntil } from "@/lib/format";
import type { TimelineEntry } from "@/lib/timeline/types";

/** Detect simple chronological inconsistencies and deadline risks (§16). */
export function detectTimelineIssues(
  events: TimelineEntry[],
  appealDeadline: string | null,
): string[] {
  const warnings: string[] = [];
  const dateOf = (t: string) =>
    events.find((e) => e.event_type === t)?.event_date ?? null;

  const incident = dateOf("incident_occurred");
  const filed = dateOf("claim_filed");
  const denial = dateOf("denial_received");
  const appeal = dateOf("appeal_submitted");

  if (incident && filed && filed < incident) {
    warnings.push("The claim filed date is before the incident date — please verify.");
  }
  if (filed && denial && denial < filed) {
    warnings.push("The denial date is before the claim filed date — please verify.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const pastTypes = ["incident_occurred", "claim_filed", "denial_received"];
  for (const e of events) {
    if (
      e.event_date &&
      e.event_date > today &&
      pastTypes.includes(e.event_type ?? "")
    ) {
      warnings.push(`"${e.title}" is dated in the future — please verify.`);
    }
  }

  const d = daysUntil(appealDeadline);
  if (d !== null && !appeal) {
    if (d < 0) {
      warnings.push(
        "Your appeal deadline appears to have passed and no appeal is recorded — verify this immediately.",
      );
    } else if (d <= 7) {
      warnings.push(
        `Your appeal deadline is in ${d} day${d === 1 ? "" : "s"} and no appeal is recorded yet.`,
      );
    }
  }

  return warnings;
}
