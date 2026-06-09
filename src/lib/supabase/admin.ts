import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseAdminConfigured } from "@/lib/env";

/**
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * SERVER-ONLY. Never import this into client components or expose the
 * service-role key to the browser. Use only for trusted admin/server tasks
 * (Stripe webhooks, background jobs, admin tooling) with explicit checks.
 *
 * Returns `null` when the service-role key is not configured.
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured) return null;

  return createSupabaseClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
