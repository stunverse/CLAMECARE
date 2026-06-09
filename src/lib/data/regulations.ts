import { createClient } from "@/lib/supabase/server";
import { US_STATES } from "@/lib/constants";
import type { StateRegulation } from "@/lib/types";

/** Generic, non-fabricated regulator label (every US state has a DOI). */
export function genericRegulatorName(stateCode: string | null): string {
  const s = US_STATES.find((x) => x.code === stateCode);
  return s ? `${s.name} Department of Insurance` : "your state Department of Insurance";
}

/** Load verified regulator info for a state, or null if none on file. */
export async function getStateRegulation(
  stateCode: string | null,
): Promise<StateRegulation | null> {
  if (!stateCode) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("state_regulations")
    .select("*")
    .eq("state_code", stateCode)
    .maybeSingle<StateRegulation>();

  return data ?? null;
}
