import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  brand: "bg-accent text-brand",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          TONE[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
