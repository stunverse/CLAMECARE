"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEmailConfigured } from "@/lib/env";
import { sendEmail, notificationEmailHtml } from "@/lib/email/send";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/types/enums";

/**
 * Internal helper to create a notification (called from other server actions).
 * Best-effort: never throws into the calling flow.
 */
export async function createNotification(
  supabase: SupabaseClient,
  input: {
    user_id: string;
    claim_id?: string | null;
    type: NotificationType;
    title: string;
    message?: string;
    action_url?: string;
  },
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id: input.user_id,
      claim_id: input.claim_id ?? null,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      action_url: input.action_url ?? null,
    });

    // Also email the user when an email provider is configured (best-effort).
    if (isEmailConfigured) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", input.user_id)
        .maybeSingle<{ email: string | null }>();
      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: input.title,
          html: notificationEmailHtml(
            input.title,
            input.message ?? input.title,
            input.action_url,
          ),
        });
      }
    }
  } catch {
    // ignore
  }
}

export async function markNotificationRead(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return {};
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/dashboard");
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) return {};
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  revalidatePath("/dashboard");
  return {};
}
