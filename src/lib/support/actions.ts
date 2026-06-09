"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PRIORITY_LEVELS, SUPPORT_TICKET_STATUSES } from "@/lib/types/enums";
import type {
  PriorityLevel,
  SupportTicket,
  SupportTicketStatus,
} from "@/lib/types";

export async function createSupportTicket(input: {
  subject: string;
  message: string;
  priority: PriorityLevel;
}): Promise<{ error?: string; ticket?: SupportTicket }> {
  if (!input.subject.trim()) return { error: "Please add a subject." };
  if (!input.message.trim()) return { error: "Please describe your issue." };
  if (!PRIORITY_LEVELS.includes(input.priority)) {
    return { error: "Invalid priority." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Connect Supabase to submit a support ticket." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject: input.subject.trim(),
      message: input.message.trim(),
      priority: input.priority,
      status: "open",
    })
    .select("*")
    .single<SupportTicket>();

  if (error || !data) return { error: error?.message ?? "Could not submit." };
  revalidatePath("/support");
  return { ticket: data };
}

export async function updateTicketStatus(input: {
  id: string;
  status: SupportTicketStatus;
}): Promise<{ error?: string }> {
  if (!SUPPORT_TICKET_STATUSES.includes(input.status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Not connected." };

  // Admin RLS policy permits this update; non-admins are blocked by RLS.
  const { error } = await supabase
    .from("support_tickets")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/admin/support");
  return {};
}
