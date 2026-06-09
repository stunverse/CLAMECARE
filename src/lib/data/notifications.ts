import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

const day = 86_400_000;
const iso = (o: number) => new Date(Date.now() + o * day).toISOString();

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "demo",
    claim_id: "demo-2",
    type: "deadline_approaching",
    title: "Appeal deadline approaching",
    message: "Your health claim appeal is due in 3 days.",
    is_read: false,
    action_url: "/claims/demo-2",
    created_at: iso(0),
  },
  {
    id: "n2",
    user_id: "demo",
    claim_id: "demo-1",
    type: "ai_analysis_complete",
    title: "AI analysis complete",
    message: "Your Geico collision claim analysis is ready to review.",
    is_read: false,
    action_url: "/claims/demo-1/analysis",
    created_at: iso(-1),
  },
  {
    id: "n3",
    user_id: "demo",
    claim_id: "demo-1",
    type: "appeal_letter_ready",
    title: "Appeal letter ready",
    message: "Your appeal letter draft is ready to review.",
    is_read: true,
    action_url: "/claims/demo-1/letters",
    created_at: iso(-3),
  },
];

export interface NotificationData {
  notifications: Notification[];
  unread: number;
}

export async function getNotifications(): Promise<NotificationData> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      notifications: DEMO_NOTIFICATIONS,
      unread: DEMO_NOTIFICATIONS.filter((n) => !n.is_read).length,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      notifications: DEMO_NOTIFICATIONS,
      unread: DEMO_NOTIFICATIONS.filter((n) => !n.is_read).length,
    };
  }

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
      .returns<Notification[]>(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  return { notifications: data ?? [], unread: count ?? 0 };
}
