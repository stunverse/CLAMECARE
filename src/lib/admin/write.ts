"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { US_STATES } from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Row } from "@/components/admin/admin-resource-manager";

/** Return the session client only if the caller is a platform admin. */
async function getAdminSupabase(): Promise<SupabaseClient | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? supabase : null;
}

const orNull = (v?: string) => (v && v.trim() ? v.trim() : null);

/** Convert a DB row to the string-map Row shape the manager expects. */
function toRow(data: Record<string, unknown>): Row {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) out[k] = null;
    else if (Array.isArray(v)) out[k] = v.join(", ");
    else out[k] = String(v);
  }
  return out as Row;
}

const NOT_AUTH = "You must be a connected admin to edit this.";

async function upsert(
  supabase: SupabaseClient,
  table: string,
  id: string | undefined,
  payload: Record<string, unknown>,
): Promise<{ error?: string; row?: Row }> {
  const q = id
    ? supabase.from(table).update(payload).eq("id", id)
    : supabase.from(table).insert(payload);
  const { data, error } = await q.select("*").single();
  if (error || !data) return { error: error?.message ?? "Could not save." };
  return { row: toRow(data) };
}

async function removeRow(
  table: string,
  id: string,
  path: string,
): Promise<{ error?: string }> {
  const supabase = await getAdminSupabase();
  if (!supabase) return { error: NOT_AUTH };
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(path);
  return {};
}

/* ----------------------------- state regulations ----------------------------- */
export async function upsertStateRegulation(values: Record<string, string>) {
  const supabase = await getAdminSupabase();
  if (!supabase) return { error: NOT_AUTH };
  if (!values.state_code?.trim()) return { error: "State is required." };

  const stateName =
    US_STATES.find((s) => s.code === values.state_code)?.name ??
    values.state_code;

  const res = await upsert(supabase, "state_regulations", values.id, {
    state_code: values.state_code.trim(),
    state_name: stateName,
    department_name: orNull(values.department_name),
    complaint_url: orNull(values.complaint_url),
    phone: orNull(values.phone),
    email: orNull(values.email),
    mailing_address: orNull(values.mailing_address),
    claim_handling_deadlines: orNull(values.claim_handling_deadlines),
    complaint_instructions: orNull(values.complaint_instructions),
    source_url: orNull(values.source_url),
    last_verified_at: new Date().toISOString(),
  });
  if (!res.error) revalidatePath("/admin/state-regulations");
  return res;
}

export async function deleteStateRegulation(id: string) {
  return removeRow("state_regulations", id, "/admin/state-regulations");
}

/* ----------------------------- insurance companies ----------------------------- */
export async function upsertInsuranceCompany(values: Record<string, string>) {
  const supabase = await getAdminSupabase();
  if (!supabase) return { error: NOT_AUTH };
  if (!values.name?.trim()) return { error: "Name is required." };

  const res = await upsert(supabase, "insurance_companies", values.id, {
    name: values.name.trim(),
    website: orNull(values.website),
    claims_url: orNull(values.claims_url),
    appeals_url: orNull(values.appeals_url),
    customer_service_phone: orNull(values.customer_service_phone),
    mailing_address: orNull(values.mailing_address),
    escalation_steps: orNull(values.escalation_steps),
    notes: orNull(values.notes),
    last_verified_at: new Date().toISOString(),
  });
  if (!res.error) revalidatePath("/admin/insurance-companies");
  return res;
}

export async function deleteInsuranceCompany(id: string) {
  return removeRow("insurance_companies", id, "/admin/insurance-companies");
}

/* ----------------------------- knowledge base ----------------------------- */
export async function upsertKnowledgeEntry(values: Record<string, string>) {
  const supabase = await getAdminSupabase();
  if (!supabase) return { error: NOT_AUTH };
  if (!values.title?.trim()) return { error: "Title is required." };

  const tags = orNull(values.tags)
    ? values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const res = await upsert(supabase, "knowledge_base_entries", values.id, {
    title: values.title.trim(),
    category: orNull(values.category),
    content: orNull(values.content),
    source_url: orNull(values.source_url),
    state: orNull(values.state),
    insurance_type: orNull(values.insurance_type),
    company: orNull(values.company),
    tags,
    last_verified_at: new Date().toISOString(),
  });
  if (!res.error) revalidatePath("/admin/knowledge-base");
  return res;
}

export async function deleteKnowledgeEntry(id: string) {
  return removeRow("knowledge_base_entries", id, "/admin/knowledge-base");
}
