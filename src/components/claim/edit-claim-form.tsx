"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateClaim } from "@/lib/claims/manage-actions";
import { INSURANCE_TYPE_LABELS, ISSUE_TYPE_LABELS } from "@/lib/labels";
import { INSURANCE_TYPES, ISSUE_TYPES } from "@/lib/types/enums";
import { US_STATES } from "@/lib/constants";
import type { Claim } from "@/lib/types";
import type { InsuranceType, IssueType } from "@/lib/types/enums";

const toNum = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const orNull = (v: string): string | null => (v.trim() ? v.trim() : null);
const s = (v: string | number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function EditClaimForm({ claim }: { claim: Claim }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [f, setF] = useState({
    claim_title: claim.claim_title,
    insurance_type: claim.insurance_type ?? "",
    issue_type: claim.issue_type ?? "",
    insurance_company: s(claim.insurance_company),
    state: s(claim.state),
    incident_state: s(claim.incident_state),
    policy_number: s(claim.policy_number),
    claim_number: s(claim.claim_number),
    adjuster_name: s(claim.adjuster_name),
    adjuster_email: s(claim.adjuster_email),
    adjuster_phone: s(claim.adjuster_phone),
    amount_claimed: s(claim.amount_claimed),
    amount_offered: s(claim.amount_offered),
    amount_paid: s(claim.amount_paid),
    estimated_loss: s(claim.estimated_loss),
    deductible: s(claim.deductible),
    incident_date: s(claim.incident_date),
    claim_filed_date: s(claim.claim_filed_date),
    denial_date: s(claim.denial_date),
    last_response_date: s(claim.last_response_date),
    appeal_deadline: s(claim.appeal_deadline),
    user_summary: s(claim.user_summary),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await updateClaim(claim.id, {
        claim_title: f.claim_title,
        insurance_type: (f.insurance_type || null) as InsuranceType | null,
        issue_type: (f.issue_type || null) as IssueType | null,
        insurance_company: orNull(f.insurance_company),
        state: orNull(f.state),
        incident_state: orNull(f.incident_state),
        policy_number: orNull(f.policy_number),
        claim_number: orNull(f.claim_number),
        adjuster_name: orNull(f.adjuster_name),
        adjuster_email: orNull(f.adjuster_email),
        adjuster_phone: orNull(f.adjuster_phone),
        amount_claimed: toNum(f.amount_claimed),
        amount_offered: toNum(f.amount_offered),
        amount_paid: toNum(f.amount_paid),
        estimated_loss: toNum(f.estimated_loss),
        deductible: toNum(f.deductible),
        incident_date: orNull(f.incident_date),
        claim_filed_date: orNull(f.claim_filed_date),
        denial_date: orNull(f.denial_date),
        last_response_date: orNull(f.last_response_date),
        appeal_deadline: orNull(f.appeal_deadline),
        user_summary: orNull(f.user_summary),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/claims/${claim.id}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <Label>Claim title</Label>
          <Input
            value={f.claim_title}
            onChange={(e) => set("claim_title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Insurance type</Label>
            <Select
              value={f.insurance_type}
              onChange={(e) => set("insurance_type", e.target.value)}
            >
              <option value="">—</option>
              {INSURANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INSURANCE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Situation</Label>
            <Select
              value={f.issue_type}
              onChange={(e) => set("issue_type", e.target.value)}
            >
              <option value="">—</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ISSUE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Insurance company"
            value={f.insurance_company}
            onChange={(v) => set("insurance_company", v)}
          />
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={f.state}
              onChange={(e) => set("state", e.target.value)}
            >
              <option value="">—</option>
              {US_STATES.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Policy number"
            value={f.policy_number}
            onChange={(v) => set("policy_number", v)}
          />
          <Field
            label="Claim number"
            value={f.claim_number}
            onChange={(v) => set("claim_number", v)}
          />
          <Field
            label="Adjuster name"
            value={f.adjuster_name}
            onChange={(v) => set("adjuster_name", v)}
          />
          <Field
            label="Adjuster email"
            type="email"
            value={f.adjuster_email}
            onChange={(v) => set("adjuster_email", v)}
          />
          <Field
            label="Adjuster phone"
            value={f.adjuster_phone}
            onChange={(v) => set("adjuster_phone", v)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Amount claimed" type="number" value={f.amount_claimed} onChange={(v) => set("amount_claimed", v)} />
          <Field label="Amount offered" type="number" value={f.amount_offered} onChange={(v) => set("amount_offered", v)} />
          <Field label="Amount paid" type="number" value={f.amount_paid} onChange={(v) => set("amount_paid", v)} />
          <Field label="Estimated loss" type="number" value={f.estimated_loss} onChange={(v) => set("estimated_loss", v)} />
          <Field label="Deductible" type="number" value={f.deductible} onChange={(v) => set("deductible", v)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Incident date" type="date" value={f.incident_date} onChange={(v) => set("incident_date", v)} />
          <Field label="Claim filed" type="date" value={f.claim_filed_date} onChange={(v) => set("claim_filed_date", v)} />
          <Field label="Denial date" type="date" value={f.denial_date} onChange={(v) => set("denial_date", v)} />
          <Field label="Last insurer response" type="date" value={f.last_response_date} onChange={(v) => set("last_response_date", v)} />
          <Field label="Appeal deadline" type="date" value={f.appeal_deadline} onChange={(v) => set("appeal_deadline", v)} />
        </div>

        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea
            value={f.user_summary}
            onChange={(e) => set("user_summary", e.target.value)}
            className="min-h-28"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button variant="brand" onClick={save} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/claims/${claim.id}`)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
