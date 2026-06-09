import { getScoreBand, type StatusVariant } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Claim } from "@/lib/types";

const BAR_COLOR: Record<StatusVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  default: "bg-brand",
  secondary: "bg-muted-foreground",
  outline: "bg-foreground",
  muted: "bg-muted-foreground",
};

interface Row {
  label: string;
  value: number | null;
  /** When true, a high value is bad (risk) — invert the color band. */
  invert?: boolean;
}

function ScoreRow({ label, value, invert }: Row) {
  const has = value !== null && value !== undefined;
  const display = has ? Math.max(0, Math.min(100, value)) : 0;
  const band = has
    ? getScoreBand(invert ? 100 - display : display)
    : { variant: "muted" as StatusVariant };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {has ? `${display}/100` : "—"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", BAR_COLOR[band.variant])}
          style={{ width: has ? `${display}%` : "0%" }}
        />
      </div>
    </div>
  );
}

/** Score breakdown panel (cahier des charges §15/§43). */
export function ScoreBreakdown({ claim }: { claim: Claim }) {
  const rows: Row[] = [
    { label: "Evidence", value: claim.evidence_score },
    { label: "Policy coverage", value: claim.policy_score },
    { label: "Timeline", value: claim.timeline_score },
    { label: "Consistency", value: claim.consistency_score },
    { label: "Negotiation", value: claim.negotiation_score },
    { label: "Risk", value: claim.risk_score, invert: true },
  ];

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <ScoreRow key={r.label} {...r} />
      ))}
    </div>
  );
}
