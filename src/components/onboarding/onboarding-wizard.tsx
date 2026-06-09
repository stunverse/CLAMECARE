"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Upload,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/auth/form-message";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { createClaim, type CreateClaimInput } from "@/lib/claims/actions";
import { INSURANCE_TYPE_LABELS, ISSUE_TYPE_LABELS } from "@/lib/labels";
import { INSURANCE_TYPES, ISSUE_TYPES } from "@/lib/types/enums";
import {
  INSURANCE_COMPANIES,
  US_STATES,
  INITIAL_UPLOAD_SUGGESTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { InsuranceType, IssueType } from "@/lib/types/enums";

const STEPS = [
  "Insurance type",
  "Your situation",
  "Insurance company",
  "Location",
  "Amounts",
  "Key dates",
  "Summary",
  "Documents",
];

const EVIDENCE_BY_TYPE: Partial<Record<InsuranceType, string[]>> = {
  auto: [
    "Police report",
    "Photos of the damage",
    "Repair estimate",
    "Denial letter",
    "Your auto policy",
  ],
  health: [
    "Denial letter",
    "Explanation of Benefits (EOB)",
    "Medical records",
    "Doctor's letter of medical necessity",
    "Your plan benefits summary",
  ],
  homeowners: [
    "Photos of the damage",
    "Repair / replacement estimate",
    "Proof of ownership",
    "Denial letter",
    "Your homeowners policy",
  ],
};
const DEFAULT_EVIDENCE = [
  "Denial letter",
  "Your insurance policy",
  "Photos, receipts, or invoices",
  "Correspondence with your insurer",
];

interface FormState {
  insurance_type: InsuranceType | "";
  issue_type: IssueType | "";
  insurance_company: string;
  insurance_company_other: string;
  state: string;
  incident_state: string;
  policy_number: string;
  claim_number: string;
  adjuster_name: string;
  adjuster_email: string;
  adjuster_phone: string;
  amount_claimed: string;
  amount_offered: string;
  amount_paid: string;
  estimated_loss: string;
  deductible: string;
  incident_date: string;
  claim_filed_date: string;
  denial_date: string;
  last_response_date: string;
  appeal_deadline: string;
  user_summary: string;
}

const EMPTY_FORM: FormState = {
  insurance_type: "",
  issue_type: "",
  insurance_company: "",
  insurance_company_other: "",
  state: "",
  incident_state: "",
  policy_number: "",
  claim_number: "",
  adjuster_name: "",
  adjuster_email: "",
  adjuster_phone: "",
  amount_claimed: "",
  amount_offered: "",
  amount_paid: "",
  estimated_loss: "",
  deductible: "",
  incident_date: "",
  claim_filed_date: "",
  denial_date: "",
  last_response_date: "",
  appeal_deadline: "",
  user_summary: "",
};

const toNum = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const orNull = (v: string): string | null => (v.trim() ? v.trim() : null);

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState<{ claimId: string; isDemo: boolean } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canAdvance =
    (step === 0 && form.insurance_type !== "") ||
    (step === 1 && form.issue_type !== "") ||
    (step !== 0 && step !== 1);

  function next() {
    setError(undefined);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }
  function back() {
    setError(undefined);
    if (step > 0) setStep((s) => s - 1);
  }

  function submit() {
    setError(undefined);
    const company =
      form.insurance_company === "Other"
        ? orNull(form.insurance_company_other)
        : orNull(form.insurance_company);

    const input: CreateClaimInput = {
      insurance_type: form.insurance_type || null,
      issue_type: form.issue_type || null,
      insurance_company: company,
      state: orNull(form.state),
      incident_state: orNull(form.incident_state),
      policy_number: orNull(form.policy_number),
      claim_number: orNull(form.claim_number),
      adjuster_name: orNull(form.adjuster_name),
      adjuster_email: orNull(form.adjuster_email),
      adjuster_phone: orNull(form.adjuster_phone),
      amount_claimed: toNum(form.amount_claimed),
      amount_offered: toNum(form.amount_offered),
      amount_paid: toNum(form.amount_paid),
      estimated_loss: toNum(form.estimated_loss),
      deductible: toNum(form.deductible),
      incident_date: orNull(form.incident_date),
      claim_filed_date: orNull(form.claim_filed_date),
      denial_date: orNull(form.denial_date),
      last_response_date: orNull(form.last_response_date),
      appeal_deadline: orNull(form.appeal_deadline),
      user_summary: orNull(form.user_summary),
    };

    startTransition(async () => {
      const result = await createClaim(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone({
        claimId: result.claimId ?? "demo",
        isDemo: Boolean(result.isDemo),
      });
    });
  }

  if (done) {
    return (
      <SuccessScreen
        claimId={done.claimId}
        isDemo={done.isDemo}
        insuranceType={form.insurance_type || null}
        company={
          form.insurance_company === "Other"
            ? form.insurance_company_other
            : form.insurance_company
        }
        state={form.state}
      />
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{STEPS[step]}</span>
          <span className="text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <StepShell
              title="What type of insurance claim do you need help with?"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {INSURANCE_TYPES.map((t) => (
                  <OptionButton
                    key={t}
                    selected={form.insurance_type === t}
                    onClick={() => set("insurance_type", t)}
                    label={INSURANCE_TYPE_LABELS[t]}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="What's your current situation?">
              <div className="grid gap-2">
                {ISSUE_TYPES.map((t) => (
                  <OptionButton
                    key={t}
                    selected={form.issue_type === t}
                    onClick={() => set("issue_type", t)}
                    label={ISSUE_TYPE_LABELS[t]}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title="Your insurance company"
              subtitle="Policy and claim numbers are optional but help us be specific."
            >
              <Field label="Insurance company">
                <Select
                  value={form.insurance_company}
                  onChange={(e) => set("insurance_company", e.target.value)}
                >
                  <option value="">Select a company…</option>
                  {INSURANCE_COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.insurance_company === "Other" && (
                <Field label="Company name">
                  <Input
                    value={form.insurance_company_other}
                    onChange={(e) =>
                      set("insurance_company_other", e.target.value)
                    }
                    placeholder="Enter the company name"
                  />
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Policy number (optional)">
                  <Input
                    value={form.policy_number}
                    onChange={(e) => set("policy_number", e.target.value)}
                  />
                </Field>
                <Field label="Claim number (optional)">
                  <Input
                    value={form.claim_number}
                    onChange={(e) => set("claim_number", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Adjuster name (optional)">
                  <Input
                    value={form.adjuster_name}
                    onChange={(e) => set("adjuster_name", e.target.value)}
                  />
                </Field>
                <Field label="Adjuster email (optional)">
                  <Input
                    type="email"
                    value={form.adjuster_email}
                    onChange={(e) => set("adjuster_email", e.target.value)}
                  />
                </Field>
                <Field label="Adjuster phone (optional)">
                  <Input
                    value={form.adjuster_phone}
                    onChange={(e) => set("adjuster_phone", e.target.value)}
                  />
                </Field>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title="Where is the claim being handled?"
              subtitle="We use your state to point you to the right Department of Insurance."
            >
              <Field label="State handling the claim">
                <Select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Select a state…</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="State where the incident happened (if different)">
                <Select
                  value={form.incident_state}
                  onChange={(e) => set("incident_state", e.target.value)}
                >
                  <option value="">Same as above</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              title="Amounts involved"
              subtitle="Enter what you know — you can refine these later."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyField
                  label="Amount claimed"
                  value={form.amount_claimed}
                  onChange={(v) => set("amount_claimed", v)}
                />
                <MoneyField
                  label="Amount offered by insurer"
                  value={form.amount_offered}
                  onChange={(v) => set("amount_offered", v)}
                />
                <MoneyField
                  label="Amount already paid"
                  value={form.amount_paid}
                  onChange={(v) => set("amount_paid", v)}
                />
                <MoneyField
                  label="Estimated loss amount"
                  value={form.estimated_loss}
                  onChange={(v) => set("estimated_loss", v)}
                />
                <MoneyField
                  label="Deductible"
                  value={form.deductible}
                  onChange={(v) => set("deductible", v)}
                />
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell
              title="Key dates"
              subtitle="Deadlines matter — add any you know."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label="Incident date"
                  value={form.incident_date}
                  onChange={(v) => set("incident_date", v)}
                />
                <DateField
                  label="Claim filed date"
                  value={form.claim_filed_date}
                  onChange={(v) => set("claim_filed_date", v)}
                />
                <DateField
                  label="Denial date"
                  value={form.denial_date}
                  onChange={(v) => set("denial_date", v)}
                />
                <DateField
                  label="Last insurer response"
                  value={form.last_response_date}
                  onChange={(v) => set("last_response_date", v)}
                />
                <DateField
                  label="Appeal deadline (if known)"
                  value={form.appeal_deadline}
                  onChange={(v) => set("appeal_deadline", v)}
                />
              </div>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title="Briefly explain what happened">
              <Textarea
                value={form.user_summary}
                onChange={(e) => set("user_summary", e.target.value)}
                placeholder="In a few sentences, describe your claim and what went wrong…"
                className="min-h-40"
              />
            </StepShell>
          )}

          {step === 7 && (
            <StepShell
              title="Documents to gather"
              subtitle="You'll be able to upload these securely right after creating your claim."
            >
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="size-4 text-brand" />
                  Helpful documents for your case
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {INITIAL_UPLOAD_SUGGESTIONS.map((d) => (
                    <li
                      key={d}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-3.5 text-success" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </StepShell>
          )}

          {error && (
            <div className="mt-4">
              <FormMessage error={error} />
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0 || pending}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {isLast ? (
              <Button variant="brand" onClick={submit} disabled={pending}>
                {pending ? "Creating…" : "Create my claim"}
                {!pending && <Sparkles className="size-4" />}
              </Button>
            ) : (
              <Button onClick={next} disabled={!canAdvance || pending}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <DisclaimerBanner variant="primary" />
      </div>
    </div>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
        selected
          ? "border-brand bg-accent text-accent-foreground"
          : "border-border hover:bg-accent/60",
      )}
    >
      {label}
      {selected && <Check className="size-4 text-brand" />}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="pl-7"
        />
      </div>
    </Field>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function SuccessScreen({
  claimId,
  isDemo,
  insuranceType,
  company,
  state,
}: {
  claimId: string;
  isDemo: boolean;
  insuranceType: InsuranceType | null;
  company: string;
  state: string;
}) {
  const evidence =
    (insuranceType && EVIDENCE_BY_TYPE[insuranceType]) || DEFAULT_EVIDENCE;
  const typeLabel = insuranceType
    ? INSURANCE_TYPE_LABELS[insuranceType]
    : "insurance";

  const summary = `You're working on a ${typeLabel.toLowerCase()} claim${
    company ? ` with ${company}` : ""
  }${state ? ` in ${state}` : ""}. We've set up your private workspace so you can upload documents, run an analysis, and prepare your response.`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">
          Your claim workspace is ready
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {summary}
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-brand" />
            Suggested documents to collect first
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {evidence.map((e) => (
              <li
                key={e}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="size-3.5 text-success" />
                {e}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isDemo && (
        <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Demo mode: this claim wasn&apos;t saved. Connect Supabase to persist
          your claims and open the full workspace.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={isDemo ? "/dashboard" : `/claims/${claimId}`}
          className={cn(buttonVariants({ variant: "brand" }))}
        >
          {isDemo ? "Back to dashboard" : "Open claim workspace"}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
