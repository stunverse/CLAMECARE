import { Info, ShieldAlert, Stethoscope, Landmark, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCLAIMERS, type DisclaimerKey } from "@/lib/legal";

type Tone = "neutral" | "warning";

const VARIANT_META: Record<DisclaimerKey, { icon: typeof Info; tone: Tone }> = {
  primary: { icon: Scale, tone: "neutral" },
  signup: { icon: Info, tone: "neutral" },
  letter: { icon: ShieldAlert, tone: "warning" },
  complaint: { icon: Landmark, tone: "warning" },
  health: { icon: Stethoscope, tone: "warning" },
  expertReview: { icon: Scale, tone: "neutral" },
};

const TONE_STYLES: Record<Tone, string> = {
  neutral: "border-border bg-muted/60 text-muted-foreground",
  warning:
    "border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning",
};

export interface DisclaimerBannerProps {
  /** Which standardized disclaimer to show (cahier des charges §34). */
  variant?: DisclaimerKey;
  /** Override the text entirely (rarely needed). */
  text?: string;
  className?: string;
}

/**
 * Standardized legal disclaimer banner.
 *
 * ClaimCare AI is not a law firm and does not provide legal advice — this
 * banner must appear on every important page and before sensitive actions.
 */
export function DisclaimerBanner({
  variant = "primary",
  text,
  className,
}: DisclaimerBannerProps) {
  const { icon: Icon, tone } = VARIANT_META[variant];

  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed",
        TONE_STYLES[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{text ?? DISCLAIMERS[variant]}</p>
    </div>
  );
}
