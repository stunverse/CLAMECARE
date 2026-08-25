import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/billing/plans";

export function BillingPlanCard({
  plan,
  interval,
  badge,
  cta,
}: {
  plan: Plan;
  interval: "monthly" | "yearly";
  badge?: string;
  cta: React.ReactNode;
}) {
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const suffix = interval === "yearly" ? "/an" : "/mois";

  return (
    <Card
      className={cn(
        "flex flex-col",
        plan.highlighted && "border-brand shadow-md ring-1 ring-brand/30",
      )}
    >
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {(badge || plan.highlighted) && (
            <Badge variant={badge ? "success" : "info"}>
              {badge ?? "Popular"}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price} €</span>
          <span className="text-sm text-muted-foreground">{suffix}</span>
        </div>

        <ul className="mt-5 flex-1 space-y-2 text-sm">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">{cta}</div>
      </CardContent>
    </Card>
  );
}
