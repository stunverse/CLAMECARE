import { Badge } from "@/components/ui/badge";
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_VARIANT } from "@/lib/labels";
import type { ClaimStatus } from "@/lib/types/enums";

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <Badge variant={CLAIM_STATUS_VARIANT[status]}>
      {CLAIM_STATUS_LABELS[status]}
    </Badge>
  );
}
