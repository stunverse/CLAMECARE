import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { rowify } from "@/lib/admin/rowify";
import { upsertLibraryItem, deleteLibraryItem } from "@/lib/admin/write";
import {
  AdminResourceManager,
  type FieldDef,
  type Row,
} from "@/components/admin/admin-resource-manager";
import { KNOWLEDGE_CATEGORIES, INSURANCE_TYPES } from "@/lib/types/enums";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  INSURANCE_TYPE_LABELS,
} from "@/lib/labels";
import { US_STATES } from "@/lib/constants";
import { LIBRARY_DEMO } from "@/lib/data/library";

export const metadata: Metadata = { title: "Admin · Library" };

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, fullWidth: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: KNOWLEDGE_CATEGORIES.map((c) => ({
      value: c,
      label: KNOWLEDGE_CATEGORY_LABELS[c],
    })),
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
  {
    name: "state",
    label: "State",
    type: "select",
    options: US_STATES.map((s) => ({ value: s.code, label: s.name })),
  },
  { name: "company", label: "Company" },
  {
    name: "is_premium",
    label: "Premium?",
    type: "select",
    options: [
      { value: "false", label: "Free" },
      { value: "true", label: "Premium" },
    ],
  },
  { name: "content", label: "Content", type: "textarea" },
];

export default async function AdminLibraryPage() {
  const { supabase, isDemo } = await getAdminContext();

  let rows: Row[] = LIBRARY_DEMO.map(rowify);
  if (supabase) {
    const { data } = await supabase
      .from("claim_library_items")
      .select("*")
      .order("created_at", { ascending: false });
    rows = (data ?? []).map(rowify);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Resource library</h1>
      <AdminResourceManager
        resourceName="resource"
        fields={FIELDS}
        listColumns={[
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "is_premium", label: "Premium" },
        ]}
        initialRows={rows}
        canEdit={!isDemo}
        upsertAction={upsertLibraryItem}
        deleteAction={deleteLibraryItem}
      />
    </div>
  );
}
