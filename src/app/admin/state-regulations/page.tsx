import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { rowify } from "@/lib/admin/rowify";
import {
  upsertStateRegulation,
  deleteStateRegulation,
} from "@/lib/admin/write";
import {
  AdminResourceManager,
  type FieldDef,
  type Row,
} from "@/components/admin/admin-resource-manager";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { US_STATES } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin · State regulations" };

const FIELDS: FieldDef[] = [
  {
    name: "state_code",
    label: "State",
    type: "select",
    required: true,
    options: US_STATES.map((s) => ({ value: s.code, label: s.name })),
  },
  { name: "department_name", label: "Department name" },
  { name: "complaint_url", label: "Complaint URL", type: "url" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "mailing_address", label: "Mailing address" },
  {
    name: "claim_handling_deadlines",
    label: "Claim-handling deadlines",
    type: "textarea",
  },
  {
    name: "complaint_instructions",
    label: "Complaint instructions",
    type: "textarea",
  },
  { name: "source_url", label: "Source URL", type: "url" },
];

const DEMO: Row[] = [
  {
    id: "d1",
    state_code: "TX",
    state_name: "Texas",
    department_name: "Texas Department of Insurance",
    complaint_url: "https://www.tdi.texas.gov/consumer/complaints.html",
  } as Row,
];

export default async function AdminStateRegulationsPage() {
  const { supabase, isDemo } = await getAdminContext();

  let rows = DEMO;
  if (supabase) {
    const { data } = await supabase
      .from("state_regulations")
      .select("*")
      .order("state_name", { ascending: true });
    rows = (data ?? []).map(rowify);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">State regulations</h1>
      <DisclaimerBanner
        variant="primary"
        text="Regulatory information should be verified with each state Department of Insurance before it is relied upon."
      />
      <AdminResourceManager
        resourceName="regulation"
        fields={FIELDS}
        listColumns={[
          { key: "state_code", label: "State" },
          { key: "department_name", label: "Department" },
          { key: "complaint_url", label: "Complaint URL" },
        ]}
        initialRows={rows}
        canEdit={!isDemo}
        upsertAction={upsertStateRegulation}
        deleteAction={deleteStateRegulation}
      />
    </div>
  );
}
