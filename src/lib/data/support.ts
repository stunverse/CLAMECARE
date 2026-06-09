import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/types";

const day = 86_400_000;
const iso = (o: number) => new Date(Date.now() + o * day).toISOString();

const DEMO_TICKETS: SupportTicket[] = [
  {
    id: "t1",
    user_id: "demo",
    subject: "How do I export my appeal letter?",
    message: "I generated a letter but I'm not sure how to save it as a PDF.",
    status: "resolved",
    priority: "medium",
    created_at: iso(-4),
    updated_at: iso(-3),
  },
  {
    id: "t2",
    user_id: "demo",
    subject: "Can I add a second claim?",
    message: "I'd like to track another claim with a different insurer.",
    status: "open",
    priority: "low",
    created_at: iso(-1),
    updated_at: iso(-1),
  },
];

export async function getUserTickets(): Promise<{
  tickets: SupportTicket[];
  isDemo: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) return { tickets: DEMO_TICKETS, isDemo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tickets: DEMO_TICKETS, isDemo: true };

  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<SupportTicket[]>();

  return { tickets: data ?? [], isDemo: false };
}
