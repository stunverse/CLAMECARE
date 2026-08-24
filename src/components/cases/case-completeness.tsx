import { Check, X, AlertTriangle } from "lucide-react";
import { completenessBand } from "@/lib/claimguard/enums";
import type { CompletenessResult } from "@/lib/cases/completeness";

export function CaseCompleteness({ result }: { result: CompletenessResult }) {
  const band = completenessBand(result.score);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{band.label}</span>
        <span className="text-sm font-semibold">{result.score} %</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${result.score}%` }}
        />
      </div>

      {result.blockers.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Éléments indispensables avant de contacter le client :{" "}
            {result.blockers.map((b) => b.label).join(", ")}.
          </span>
        </div>
      )}

      <ul className="space-y-1.5">
        {result.fields.map((f) => (
          <li key={f.key} className="flex items-center gap-2 text-sm">
            {f.present ? (
              <Check className="size-3.5 shrink-0 text-success" />
            ) : (
              <X className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span
              className={
                f.present ? "" : "text-muted-foreground"
              }
            >
              {f.label}
            </span>
            {!f.present && f.blocking && (
              <span className="ml-auto text-[10px] font-medium uppercase text-warning">
                requis
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
