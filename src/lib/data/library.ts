import { createClient } from "@/lib/supabase/server";
import type { ClaimLibraryItem } from "@/lib/types";

const ts = new Date().toISOString();

/** Seed content shown in demo mode (no Supabase). Admins manage real items. */
export const LIBRARY_DEMO: ClaimLibraryItem[] = [
  {
    id: "lib-1",
    title: "How to appeal a denied health claim",
    category: "insurance_type_guide",
    insurance_type: "health",
    state: null,
    company: null,
    is_premium: false,
    content:
      "1. Read your denial letter and Explanation of Benefits (EOB) carefully to find the exact reason and codes.\n2. Request your full claim file and the specific policy provision the insurer relied on, in writing.\n3. Gather supporting evidence: medical records, a letter of medical necessity from your doctor, and prior authorizations.\n4. Write an appeal that directly addresses the stated denial reason.\n5. Submit before the appeal deadline and keep proof of delivery.\n\nIf the internal appeal is denied, ask about an external/independent review.",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "lib-2",
    title: "Auto claim evidence checklist",
    category: "evidence_checklist",
    insurance_type: "auto",
    state: null,
    company: null,
    is_premium: false,
    content:
      "Critical:\n- Police or accident report\n- Dated photos of the damage\n- Repair estimate from a licensed shop\n- The denial letter\n\nImportant:\n- Your auto policy and declarations page\n- Tow/storage invoices\n- Medical records (if injury)\n\nHelpful:\n- Correspondence with the adjuster\n- Witness statements",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "lib-3",
    title: "Denial reason: ‘Damage not covered’",
    category: "denial_reason",
    insurance_type: null,
    state: null,
    company: null,
    is_premium: false,
    content:
      "Insurers sometimes deny a claim by stating the damage is not a covered peril. To respond:\n- Identify the exact exclusion they cite and read the policy language.\n- Determine whether the cause of loss actually falls under a covered peril.\n- Provide evidence (photos, reports, expert estimates) showing the covered cause.\n- Ask the insurer to point to the specific provision in writing.\n\nThis is informational only — for legal questions, consult a licensed attorney.",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "lib-4",
    title: "Insurance glossary: key terms",
    category: "glossary",
    insurance_type: null,
    state: null,
    company: null,
    is_premium: false,
    content:
      "Deductible — the amount you pay out of pocket before coverage applies.\nExclusion — a loss or cause the policy does not cover.\nEOB — Explanation of Benefits, a health insurer's statement of what was paid.\nAdjuster — the insurer's representative who evaluates your claim.\nSubrogation — the insurer's right to recover costs from a responsible third party.\nBad faith — an insurer's unreasonable handling of a valid claim.",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "lib-5",
    title: "Appeal letter template (general)",
    category: "letter_template",
    insurance_type: null,
    state: null,
    company: null,
    is_premium: true,
    content:
      "[Date]\n[Your name / address]\n[Insurer]\nRe: Appeal of Claim [number] — Policy [number]\n\nTo Whom It May Concern,\n\nI am writing to appeal the decision on the above claim. [State the denial reason and why it should be reconsidered.] Enclosed is supporting evidence: [list]. I respectfully request a review and a written response by [date].\n\nSincerely,\n[Your name]",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "lib-6",
    title: "Filing a complaint with your state DOI",
    category: "state_regulation",
    insurance_type: null,
    state: null,
    company: null,
    is_premium: true,
    content:
      "Every US state has a Department of Insurance (DOI) that accepts consumer complaints. General steps:\n1. Find your state's DOI complaint page.\n2. Prepare a summary of facts, key dates, and the insurer's decision.\n3. Attach your denial letter, policy, and correspondence.\n4. Submit online or by mail and keep a copy.\n\nProcedures vary by state — always verify the requirements with your state DOI before filing.",
    created_at: ts,
    updated_at: ts,
  },
];

export async function getLibraryItems(): Promise<{
  items: ClaimLibraryItem[];
  isDemo: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) return { items: LIBRARY_DEMO, isDemo: true };

  const { data } = await supabase
    .from("claim_library_items")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ClaimLibraryItem[]>();

  return { items: data ?? [], isDemo: false };
}

export async function getLibraryItem(
  id: string,
): Promise<ClaimLibraryItem | null> {
  const supabase = await createClient();
  if (!supabase) return LIBRARY_DEMO.find((i) => i.id === id) ?? null;

  const { data } = await supabase
    .from("claim_library_items")
    .select("*")
    .eq("id", id)
    .maybeSingle<ClaimLibraryItem>();

  return data ?? null;
}
