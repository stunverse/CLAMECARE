import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminContext {
  isDemo: boolean;
  supabase: SupabaseClient | null;
  role: "admin" | "agent";
  userId: string | null;
}

/**
 * Guard for admin routes. In placeholder mode (no Supabase) we allow access
 * with demo data so the UI is visible. When configured, the visitor must be
 * in admin_users (enforced by RLS via is_admin()); otherwise we 404 to keep
 * the admin area hidden.
 *
 * Cached per request so the layout and page don't double-check.
 */
export const getAdminContext = cache(async (): Promise<AdminContext> => {
  const supabase = await createClient();
  if (!supabase)
    return { isDemo: true, supabase: null, role: "admin", userId: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string; role: "admin" | "agent" | null }>();

  if (!adminRow) notFound();

  return {
    isDemo: false,
    supabase,
    role: adminRow.role ?? "admin",
    userId: user.id,
  };
});
