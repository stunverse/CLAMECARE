/**
 * Deterministic reminder scheduling (cahier des charges §17/§62-6).
 *
 * Pure date arithmetic — no AI, no randomness — so the cadence is auditable
 * and testable. Times are evaluated in UTC; the business window can be
 * refined to a specific timezone later without changing the shape.
 */

export interface RemindersConfig {
  first_contact_day: number;
  reminder_days: number[];
  max_reminders: number;
  send_hour_start: number; // inclusive
  send_hour_end: number; // exclusive
  send_days: number[]; // ISO weekday 1..7 (Mon..Sun)
}

export const DEFAULT_REMINDERS: RemindersConfig = {
  first_contact_day: 0,
  reminder_days: [3, 7, 14],
  max_reminders: 3,
  send_hour_start: 9,
  send_hour_end: 18,
  send_days: [1, 2, 3, 4, 5],
};

/** Merge a stored settings value onto the defaults, ignoring bad shapes. */
export function parseRemindersConfig(value: unknown): RemindersConfig {
  const v = (value ?? {}) as Partial<RemindersConfig>;
  return {
    first_contact_day:
      typeof v.first_contact_day === "number"
        ? v.first_contact_day
        : DEFAULT_REMINDERS.first_contact_day,
    reminder_days:
      Array.isArray(v.reminder_days) && v.reminder_days.every((n) => typeof n === "number")
        ? v.reminder_days
        : DEFAULT_REMINDERS.reminder_days,
    max_reminders:
      typeof v.max_reminders === "number"
        ? v.max_reminders
        : DEFAULT_REMINDERS.max_reminders,
    send_hour_start:
      typeof v.send_hour_start === "number"
        ? v.send_hour_start
        : DEFAULT_REMINDERS.send_hour_start,
    send_hour_end:
      typeof v.send_hour_end === "number"
        ? v.send_hour_end
        : DEFAULT_REMINDERS.send_hour_end,
    send_days:
      Array.isArray(v.send_days) && v.send_days.every((n) => typeof n === "number")
        ? v.send_days
        : DEFAULT_REMINDERS.send_days,
  };
}

/** ISO weekday 1..7 (Mon..Sun) for a Date, in UTC. */
function isoWeekday(d: Date): number {
  const dow = d.getUTCDay(); // 0..6 (Sun..Sat)
  return dow === 0 ? 7 : dow;
}

/**
 * Move a date forward to the next allowed send slot: an allowed weekday, at or
 * after send_hour_start and strictly before send_hour_end. If the given moment
 * already sits inside the window on an allowed day, it is returned unchanged.
 */
export function clampToBusinessWindow(
  date: Date,
  config: RemindersConfig,
): Date {
  const d = new Date(date.getTime());
  // Guard against a degenerate config.
  const days = config.send_days.length ? config.send_days : DEFAULT_REMINDERS.send_days;
  const start = config.send_hour_start;
  const end = config.send_hour_end > start ? config.send_hour_end : start + 1;

  for (let i = 0; i < 14; i++) {
    const okDay = days.includes(isoWeekday(d));
    if (okDay) {
      const hour = d.getUTCHours();
      if (hour < start) {
        d.setUTCHours(start, 0, 0, 0);
        return d;
      }
      if (hour < end) {
        return d; // already inside the window
      }
    }
    // Move to start-of-window on the next calendar day and retry.
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(start, 0, 0, 0);
  }
  return d;
}

/** Add whole days to a date (UTC), returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * When should reminder number `reminderIndex` (0-based) fire, measured from
 * `baseDate` (usually the first-contact date)? Returns null when the index
 * exceeds the configured reminder schedule / max.
 */
export function nextReminderAt(
  baseDate: Date,
  reminderIndex: number,
  config: RemindersConfig,
): Date | null {
  if (reminderIndex < 0) return null;
  if (reminderIndex >= config.reminder_days.length) return null;
  if (reminderIndex >= config.max_reminders) return null;
  const offset = config.reminder_days[reminderIndex];
  return clampToBusinessWindow(addDays(baseDate, offset), config);
}
