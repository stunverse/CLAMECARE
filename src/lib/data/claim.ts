import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEMO_CLAIMS } from "@/lib/data/demo";
import type { Claim } from "@/lib/types";

/**
 * Load a single claim, deduplicated per request via React cache() so the
 * layout and the page don't double-query. Returns demo claims when Supabase
 * is not configured / no session; otherwise the user's own claim (RLS-scoped)
 * or null when not found.
 */
export const getClaim = cache(async (id: string): Promise<Claim | null> => {
  const supabase = await createClient();

  if (!supabase) {
    return DEMO_CLAIMS.find((c) => c.id === id) ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return DEMO_CLAIMS.find((c) => c.id === id) ?? null;
  }

  const { data } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .maybeSingle<Claim>();

  return data ?? null;
});
