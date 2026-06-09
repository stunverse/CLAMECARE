import { cn } from "@/lib/utils";
import { getScoreBand } from "@/lib/labels";

const SIZES = {
  sm: { box: 64, stroke: 6, text: "text-base" },
  md: { box: 96, stroke: 8, text: "text-2xl" },
  lg: { box: 140, stroke: 10, text: "text-4xl" },
} as const;

const BAND_COLOR: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  default: "text-brand",
  secondary: "text-muted-foreground",
  outline: "text-foreground",
  muted: "text-muted-foreground",
};

export interface ScoreCircleProps {
  /** Score 0-100. Null/undefined renders an empty "—" ring. */
  score: number | null | undefined;
  size?: keyof typeof SIZES;
  /** Show the band label (Weak / Moderate / Strong / Very strong) below. */
  showBand?: boolean;
  className?: string;
}

/**
 * Circular score gauge (cahier des charges §15/§43).
 * Pure SVG — no client JS required.
 */
export function ScoreCircle({
  score,
  size = "md",
  showBand = false,
  className,
}: ScoreCircleProps) {
  const { box, stroke, text } = SIZES[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasScore = score !== null && score !== undefined;
  const clamped = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const dash = (clamped / 100) * circumference;
  const band = hasScore ? getScoreBand(clamped) : null;
  const colorClass = band ? BAND_COLOR[band.variant] : "text-muted-foreground";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-border"
          />
          {hasScore && (
            <circle
              cx={box / 2}
              cy={box / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={cn("transition-[stroke-dasharray]", colorClass)}
              stroke="currentColor"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", text, colorClass)}>
            {hasScore ? clamped : "—"}
          </span>
        </div>
      </div>
      {showBand && band && (
        <span className={cn("text-sm font-medium", colorClass)}>
          {band.label}
        </span>
      )}
    </div>
  );
}
