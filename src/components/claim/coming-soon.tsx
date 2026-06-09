import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Clean placeholder for claim workspace tabs that are wired up in later
 * lots. Shows what the tab will do so the structure is visible today.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  bullets,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
          <Icon className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        )}
        <span className="mt-6 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
        {children && <div className="mt-6 text-left">{children}</div>}
      </CardContent>
    </Card>
  );
}
