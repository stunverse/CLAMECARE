/**
 * Formatting helpers (US locale / USD by default).
 */

/** Format a money amount as USD. Returns "—" for null/undefined. */
export function formatCurrency(
  amount: number | null | undefined,
  options: { compact?: boolean } = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 2,
  }).format(amount);
}

/** Format an ISO date/timestamp as e.g. "Jun 9, 2026". Returns "—" if empty. */
export function formatDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Whole days from today until `value` (negative if past). null if no date. */
export function daysUntil(
  value: string | Date | null | undefined,
): number | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const startOfToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const startOfTarget = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((startOfTarget - startOfToday) / 86_400_000);
}

/** Human deadline label, e.g. "in 5 days", "today", "3 days overdue". */
export function formatDeadline(
  value: string | Date | null | undefined,
): string {
  const days = daysUntil(value);
  if (days === null) return "—";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `Due in ${days} days`;
}

/** Format a byte size as e.g. "1.2 MB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
