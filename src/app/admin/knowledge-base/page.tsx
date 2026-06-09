import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { rowify } from "@/lib/admin/rowify";
import { upsertKnowledgeEntry, deleteKnowledgeEntry } from "@/lib/admin/write";
import {
  AdminResourceManager,
  type FieldDef,
  type Row,
} from "@/components/admin/admin-resource-manager";
import { KNOWLEDGE_CATEGORIES, INSURANCE_TYPES } from "@/lib/types/enums";
import { INSURANCE_TYPE_LABELS, humanize } from "@/lib/labels";
import { US_STATES } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin · Knowledge base" };

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, fullWidth: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: KNOWLEDGE_CATEGORIES.map((c) => ({
      value: c,
      label: humanize(c),
    })),
  },
  {
    name: "state",
    label: "State",
    type: "select",
    options: US_STATES.map((s) => ({ value: s.code, label: s.name })),
  },
  {
    name: "insurance_type",
    label: "Insurance type",
    type: "select",
    options: INSURANCE_TYPES.map((t) => ({
      value: t,
      label: INSURANCE_TYPE_LABELS[t],
    })),
  },
  { name: "company", label: "Company" },
  { name: "source_url", label: "Source URL", type: "url" },
  { name: "tags", label: "Tags (comma-separated)" },
  { name: "content", label: "Content", type: "textarea" },
];

const DEMO: Row[] = [
  {
    id: "d1",
    title: "How to appeal a health claim denial",
    category: "insurance_type_guide",
    state: null,
    insurance_type: "health",
  } as Row,
];

export default async function AdminKnowledgeBasePage() {
  const { supabase, isDemo } = await getAdminContext();

  let rows = DEMO;
  if (supabase) {
    const { data } = await supabase
      .from("knowledge_base_entries")
      .select("*")
      .order("created_at", { ascending: false });
    rows = (data ?? []).map(rowify);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Knowledge base</h1>
      <AdminResourceManager
        resourceName="entry"
        fields={FIELDS}
        listColumns={[
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "state", label: "State" },
          { key: "insurance_type", label: "Type" },
        ]}
        initialRows={rows}
        canEdit={!isDemo}
        upsertAction={upsertKnowledgeEntry}
        deleteAction={deleteKnowledgeEntry}
      />
    </div>
  );
}
