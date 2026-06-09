import type { Row } from "@/components/admin/admin-resource-manager";

/** Convert a DB record into the string-map Row shape the manager expects. */
export function rowify(data: Record<string, unknown>): Row {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) out[k] = null;
    else if (Array.isArray(v)) out[k] = v.join(", ");
    else out[k] = String(v);
  }
  return out as Row;
}
