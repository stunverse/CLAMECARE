import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Server-side Supabase client (RLS-scoped to the signed-in user).
 *
 * Returns `null` when Supabase is not configured yet so the app keeps
 * building/running with placeholders. Callers MUST handle the null case.
 *
 * Usage:
 *   const supabase = await createClient();
 *   if (!supabase) { ...graceful fallback... }
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component — safe to ignore
          // when middleware is responsible for refreshing the session.
        }
      },
    },
  });
}
