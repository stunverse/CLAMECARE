"use server";

import { createClient } from "@/lib/supabase/server";
import { parseRemindersConfig } from "@/lib/claimguard/workflow/schedule";

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: "Non configuré." as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." as const };
  const { data } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: "admin" | "agent" | null }>();
  if (!data || (data.role ?? "admin") !== "admin") {
    return { error: "Réservé aux administrateurs." as const };
  }
  return { supabase, userId: user.id };
}

export interface UpdateRemindersInput {
  reminder_days: number[];
  max_reminders: number;
  send_hour_start: number;
  send_hour_end: number;
  send_days: number[];
}

export async function updateRemindersSettings(
  input: UpdateRemindersInput,
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;

  const value = parseRemindersConfig({
    first_contact_day: 0,
    ...input,
  });

  const { error } = await supabase
    .from("automation_settings")
    .update({ value })
    .eq("key", "reminders");
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "automation_settings_updated",
    source: "admin",
    metadata: { key: "reminders" },
  });
  return {};
}

export interface UpdateThresholdsInput {
  auto_send_min_confidence: number;
  review_min_confidence: number;
}

export async function updateThresholdsSettings(
  input: UpdateThresholdsInput,
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, userId } = ctx;

  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const value = {
    auto_send_min_confidence: clamp(input.auto_send_min_confidence),
    review_min_confidence: clamp(input.review_min_confidence),
  };

  const { error } = await supabase
    .from("automation_settings")
    .update({ value })
    .eq("key", "ai_thresholds");
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "automation_settings_updated",
    source: "admin",
    metadata: { key: "ai_thresholds" },
  });
  return {};
}
