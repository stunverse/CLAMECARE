import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClaim } from "@/lib/data/claim";
import { getClaimTimeline } from "@/lib/data/timeline";
import { getClaimEvidence } from "@/lib/data/evidence";
import { getClaimDocuments } from "@/lib/data/documents";
import { getClaimLetters } from "@/lib/data/letters";
import { isSupabaseConfigured } from "@/lib/env";
import { mockAnalyzeClaim } from "@/lib/ai";
import { PrintBar } from "@/components/packet/print-bar";
import { PRIMARY_DISCLAIMER } from "@/lib/legal";
import {
  CLAIM_STATUS_LABELS,
  PRIORITY_LABELS,
  DENIAL_REASON_LABELS,
  INSURANCE_TYPE_LABELS,
  TIMELINE_EVENT_TYPE_LABELS,
  EVIDENCE_IMPORTANCE_LABELS,
  EVIDENCE_STATUS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  getScoreBand,
} from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EvidenceImportance, EvidenceStatus } from "@/lib/types/enums";

export const metadata: Metadata = { title: "Claim packet" };

interface EvItem {
  title: string;
  importance: EvidenceImportance;
  status: EvidenceStatus;
  ai_reason?: string | null;
}

export default async function PacketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);
  if (!claim) notFound();

  const [timeline, evidenceRows, documents, letters] = await Promise.all([
    getClaimTimeline(claim),
    getClaimEvidence(id),
    getClaimDocuments(id),
    getClaimLetters(id),
  ]);

  let evidence: EvItem[] = evidenceRows.map((e) => ({
    title: e.title,
    importance: e.importance,
    status: e.status,
    ai_reason: e.ai_reason,
  }));
  if (evidence.length === 0 && !isSupabaseConfigured) {
    evidence = mockAnalyzeClaim({ claim, documents: [] }).evidence_checklist.map(
      (e) => ({
        title: e.title,
        importance: e.importance,
        status: "missing" as const,
        ai_reason: e.reason,
      }),
    );
  }

  const appealLetter =
    letters.find((l) => l.document_type === "appeal_letter") ?? letters[0];

  const band =
    claim.success_score !== null ? getScoreBand(claim.success_score) : null;

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <style>{`
        @page { margin: 0.8in; }
        @media print {
          body { background: #fff !important; }
          .break-before-page { break-before: page; }
          .packet-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <PrintBar claimId={id} />

      <div className="mx-auto my-6 max-w-3xl space-y-6 px-4 print:my-0 print:px-0">
        {/* Cover */}
        <section className="packet-card flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center shadow-sm print:min-h-0 print:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            ClaimCare AI
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Claim Packet</h1>
          <p className="mt-2 text-xl">{claim.claim_title}</p>
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 text-left text-sm">
            <Meta label="Insurer" value={claim.insurance_company} />
            <Meta
              label="Type"
              value={
                claim.insurance_type
                  ? INSURANCE_TYPE_LABELS[claim.insurance_type]
                  : null
              }
            />
            <Meta label="Policy #" value={claim.policy_number} />
            <Meta label="Claim #" value={claim.claim_number} />
            <Meta label="State" value={claim.state} />
            <Meta label="Prepared" value={formatDate(new Date().toISOString())} />
          </dl>
        </section>

        {/* Claim summary */}
        <Block title="1. Claim summary" breakBefore>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            <Meta label="Status" value={CLAIM_STATUS_LABELS[claim.current_status]} />
            <Meta label="Priority" value={PRIORITY_LABELS[claim.priority_level]} />
            <Meta
              label="Denial reason"
              value={
                claim.detected_denial_reason
                  ? DENIAL_REASON_LABELS[claim.detected_denial_reason]
                  : null
              }
            />
            <Meta label="Amount claimed" value={formatCurrency(claim.amount_claimed)} />
            <Meta label="Amount offered" value={formatCurrency(claim.amount_offered)} />
            <Meta label="Deductible" value={formatCurrency(claim.deductible)} />
            <Meta label="Incident date" value={formatDate(claim.incident_date)} />
            <Meta label="Claim filed" value={formatDate(claim.claim_filed_date)} />
            <Meta label="Appeal deadline" value={formatDate(claim.appeal_deadline)} />
          </div>

          {band && (
            <p className="mt-4 text-sm">
              <span className="font-semibold">Claim strength score:</span>{" "}
              {claim.success_score}/100 ({band.label})
            </p>
          )}

          {claim.user_summary && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your description
              </p>
              <p className="mt-1 text-sm leading-relaxed">{claim.user_summary}</p>
            </div>
          )}
          {claim.ai_summary && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI summary
              </p>
              <p className="mt-1 text-sm leading-relaxed">{claim.ai_summary}</p>
            </div>
          )}
        </Block>

        {/* Timeline */}
        <Block title="2. Timeline" breakBefore>
          {timeline.length === 0 ? (
            <Empty>No timeline events recorded.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...timeline]
                .sort((a, b) =>
                  (a.event_date ?? "9999").localeCompare(b.event_date ?? "9999"),
                )
                .map((e) => (
                  <li key={e.id} className="flex justify-between gap-4">
                    <span>
                      <span className="font-medium">{e.title}</span>
                      {e.event_type && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {TIMELINE_EVENT_TYPE_LABELS[e.event_type]}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDate(e.event_date)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Block>

        {/* Evidence */}
        <Block title="3. Evidence list" breakBefore>
          {evidence.length === 0 ? (
            <Empty>No evidence items yet.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {evidence.map((e, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    <span className="font-medium">{e.title}</span>
                    {e.ai_reason && (
                      <span className="block text-xs text-muted-foreground">
                        {e.ai_reason}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {EVIDENCE_IMPORTANCE_LABELS[e.importance]} ·{" "}
                    {EVIDENCE_STATUS_LABELS[e.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* Appeal letter */}
        <Block title="4. Appeal letter" breakBefore>
          {appealLetter?.content ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {appealLetter.content}
            </pre>
          ) : (
            <Empty>
              No appeal letter has been generated yet. Generate one from the
              Letters tab to include it here.
            </Empty>
          )}
        </Block>

        {/* Supporting documents */}
        <Block title="5. Supporting documents" breakBefore>
          {documents.length === 0 ? (
            <Empty>No documents uploaded.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {documents.map((d) => (
                <li key={d.id} className="flex justify-between gap-4">
                  <span className="font-medium">{d.file_name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {DOCUMENT_CATEGORY_LABELS[d.document_category]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* Disclaimer */}
        <Block title="Disclaimer" breakBefore>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {PRIMARY_DISCLAIMER}
          </p>
        </Block>
      </div>
    </div>
  );
}

function Block({
  title,
  breakBefore,
  children,
}: {
  title: string;
  breakBefore?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`packet-card rounded-xl border border-border bg-card p-8 shadow-sm ${
        breakBefore ? "break-before-page" : ""
      }`}
    >
      <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
