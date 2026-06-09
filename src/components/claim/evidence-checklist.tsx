import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EVIDENCE_IMPORTANCE_LABELS,
  EVIDENCE_IMPORTANCE_VARIANT,
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_STATUS_VARIANT,
} from "@/lib/labels";
import type { EvidenceImportance, EvidenceStatus } from "@/lib/types/enums";

export interface ChecklistItem {
  id?: string;
  title: string;
  importance: EvidenceImportance;
  status: EvidenceStatus;
  ai_reason?: string | null;
  how_to_get_it?: string | null;
}

const IMPORTANCE_ORDER: Record<EvidenceImportance, number> = {
  critical: 0,
  important: 1,
  helpful: 2,
  optional: 3,
};

export function EvidenceChecklist({ items }: { items: ChecklistItem[] }) {
  const sorted = [...items].sort(
    (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance],
  );
  const provided = items.filter(
    (i) => i.status === "uploaded" || i.status === "reviewed",
  ).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {provided} of {items.length} items provided
      </p>
      {sorted.map((item, i) => (
        <Card key={item.id ?? i}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={EVIDENCE_IMPORTANCE_VARIANT[item.importance]}>
                  {EVIDENCE_IMPORTANCE_LABELS[item.importance]}
                </Badge>
                <Badge variant={EVIDENCE_STATUS_VARIANT[item.status]}>
                  {EVIDENCE_STATUS_LABELS[item.status]}
                </Badge>
              </div>
            </div>
            {item.ai_reason && (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.ai_reason}
              </p>
            )}
            {item.how_to_get_it && (
              <p className="mt-1 text-sm">
                <span className="font-medium">How to get it: </span>
                <span className="text-muted-foreground">
                  {item.how_to_get_it}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
