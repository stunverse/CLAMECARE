import {
  ShieldCheck,
  ShieldX,
  Coins,
  Gauge,
  CalendarClock,
  ClipboardList,
  Scale,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PolicyAnalysisResult } from "@/lib/ai/policy";

function ClauseList({
  icon: Icon,
  title,
  items,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
  tone?: "default" | "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "text-brand";
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 pb-2">
        <Icon className={cn("size-4", color)} />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None found.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {items.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    tone === "danger"
                      ? "bg-danger"
                      : tone === "success"
                        ? "bg-success"
                        : "bg-brand",
                  )}
                />
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StrengthBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger";
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "success" ? "bg-success" : "bg-danger",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function PolicyView({ result }: { result: PolicyAnalysisResult }) {
  const showStrength =
    result.insurer_position_strength !== null ||
    result.policyholder_position_strength !== null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{result.summary_for_user}</p>
          {showStrength && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.policyholder_position_strength !== null && (
                <StrengthBar
                  label="Your position"
                  value={result.policyholder_position_strength}
                  tone="success"
                />
              )}
              {result.insurer_position_strength !== null && (
                <StrengthBar
                  label="Insurer's position"
                  value={result.insurer_position_strength}
                  tone="danger"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ClauseList
          icon={ShieldCheck}
          title="Applicable coverages"
          items={result.applicable_coverages}
          tone="success"
        />
        <ClauseList
          icon={ShieldX}
          title="Exclusions found"
          items={result.exclusions_found}
          tone="danger"
        />
        <ClauseList icon={Coins} title="Deductibles" items={result.deductibles} />
        <ClauseList icon={Gauge} title="Limits" items={result.limits} />
        <ClauseList
          icon={CalendarClock}
          title="Deadlines"
          items={result.deadlines}
        />
        <ClauseList
          icon={ClipboardList}
          title="Your obligations"
          items={result.insured_obligations}
        />
        <ClauseList
          icon={Scale}
          title="Appeal process"
          items={result.appeal_process}
        />
        <ClauseList
          icon={ThumbsUp}
          title="Useful clauses"
          items={result.useful_clauses}
          tone="success"
        />
      </div>

      {result.risky_clauses.length > 0 && (
        <ClauseList
          icon={AlertTriangle}
          title="Risky clauses to be aware of"
          items={result.risky_clauses}
          tone="danger"
        />
      )}
    </div>
  );
}
