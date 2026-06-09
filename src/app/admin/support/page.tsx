import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { AdminTickets } from "@/components/admin/admin-tickets";
import type { SupportTicket } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Support" };

const day = 86_400_000;
const iso = (o: number) => new Date(Date.now() + o * day).toISOString();

const DEMO: SupportTicket[] = [
  {
    id: "t1",
    user_id: "demo",
    subject: "How do I export my appeal letter?",
    message: "I generated a letter but I'm not sure how to save it as a PDF.",
    status: "open",
    priority: "medium",
    created_at: iso(-1),
    updated_at: iso(-1),
  },
  {
    id: "t2",
    user_id: "demo",
    subject: "Billing question",
    message: "Can I switch from monthly to yearly?",
    status: "in_progress",
    priority: "low",
    created_at: iso(-3),
    updated_at: iso(-2),
  },
];

export default async function AdminSupportPage() {
  const { supabase, isDemo } = await getAdminContext();

  let tickets: SupportTicket[] = DEMO;
  if (supabase) {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<SupportTicket[]>();
    tickets = data ?? [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Support tickets</h1>
      <AdminTickets tickets={tickets} canEdit={!isDemo} />
    </div>
  );
}
