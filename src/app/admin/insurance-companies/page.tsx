import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin/guard";
import { rowify } from "@/lib/admin/rowify";
import {
  upsertInsuranceCompany,
  deleteInsuranceCompany,
} from "@/lib/admin/write";
import {
  AdminResourceManager,
  type FieldDef,
  type Row,
} from "@/components/admin/admin-resource-manager";

export const metadata: Metadata = { title: "Admin · Companies" };

const FIELDS: FieldDef[] = [
  { name: "name", label: "Company name", required: true },
  { name: "website", label: "Website", type: "url" },
  { name: "claims_url", label: "Claims URL", type: "url" },
  { name: "appeals_url", label: "Appeals URL", type: "url" },
  { name: "customer_service_phone", label: "Customer service phone" },
  { name: "mailing_address", label: "Mailing address" },
  { name: "escalation_steps", label: "Escalation steps", type: "textarea" },
  { name: "notes", label: "Internal notes", type: "textarea" },
];

const DEMO: Row[] = [
  {
    id: "d1",
    name: "Geico",
    website: "https://www.geico.com",
    customer_service_phone: "1-800-841-3000",
  } as Row,
  {
    id: "d2",
    name: "State Farm",
    website: "https://www.statefarm.com",
    customer_service_phone: "1-800-782-8332",
  } as Row,
];

export default async function AdminCompaniesPage() {
  const { supabase, isDemo } = await getAdminContext();

  let rows = DEMO;
  if (supabase) {
    const { data } = await supabase
      .from("insurance_companies")
      .select("*")
      .order("name", { ascending: true });
    rows = (data ?? []).map(rowify);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Insurance companies
      </h1>
      <AdminResourceManager
        resourceName="company"
        fields={FIELDS}
        listColumns={[
          { key: "name", label: "Name" },
          { key: "website", label: "Website" },
          { key: "customer_service_phone", label: "Phone" },
        ]}
        initialRows={rows}
        canEdit={!isDemo}
        upsertAction={upsertInsuranceCompany}
        deleteAction={deleteInsuranceCompany}
      />
    </div>
  );
}
