import { cn } from "@/lib/utils";

/** Usage row with a progress bar (cahier des charges §43). null limit = unlimited. */
export function UsageLimitBanner({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const over = !unlimited && used >= (limit ?? 0);
  const near = !unlimited && pct >= 80;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used}
          {unlimited ? " · Unlimited" : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-danger" : near ? "bg-warning" : "bg-brand",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
