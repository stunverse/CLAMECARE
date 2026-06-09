import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Browser-side Supabase client.
 *
 * Returns `null` when Supabase is not configured yet (placeholder mode).
 * Callers MUST handle the null case and degrade gracefully.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
}
