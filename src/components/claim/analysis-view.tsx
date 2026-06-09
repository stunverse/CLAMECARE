import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ListOrdered,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DENIAL_REASON_LABELS } from "@/lib/labels";
import type { AnalyzeClaimResult } from "@/lib/ai/types";

function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone: "success" | "warning";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  const color = tone === "success" ? "text-success" : "text-warning";
  return (
    <ul className="space-y-2 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalysisView({ analysis }: { analysis: AnalyzeClaimResult }) {
  const flags = [
    { on: analysis.should_appeal, label: "Consider appealing" },
    { on: analysis.should_request_more_info, label: "Request more info" },
    { on: analysis.should_file_complaint, label: "Consider a complaint" },
    { on: analysis.should_consult_attorney, label: "Consider an attorney" },
  ].filter((f) => f.on);

  return (
    <div className="space-y-4">
      {/* Denial reason */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Why your claim was flagged</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {analysis.denial_reason && (
            <Badge variant="warning">
              {DENIAL_REASON_LABELS[analysis.denial_reason]}
            </Badge>
          )}
          <p className="leading-relaxed">
            {analysis.denial_reason_explained_simple}
          </p>
        </CardContent>
      </Card>

      {/* Strengths / weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={analysis.strengths} tone="success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weaknesses</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={analysis.weaknesses} tone="warning" />
          </CardContent>
        </Card>
      </div>

      {/* Risk flags */}
      {analysis.risk_flags.length > 0 && (
        <Card className="border-danger/40">
          <CardHeader className="flex-row items-center gap-2 pb-3">
            <ShieldAlert className="size-4 text-danger" />
            <CardTitle className="text-base text-danger">Risk flags</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analysis.risk_flags.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Strategy */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <ListOrdered className="size-4 text-brand" />
          <CardTitle className="text-base">Recommended strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {analysis.recommended_strategy.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-brand">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Next action + flags */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended next action
            </p>
            <p className="mt-1 font-medium">{analysis.recommended_next_action}</p>
          </div>
          {flags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Flag className="size-4 text-muted-foreground" />
              {flags.map((f) => (
                <Badge key={f.label} variant="info">
                  {f.label}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Confidence in this analysis: {analysis.confidence_level}/100. This is
            informational only and not a prediction or guarantee of any outcome.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
