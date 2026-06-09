"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { updateClaimStatus } from "@/lib/claims/manage-actions";
import { CLAIM_STATUS_LABELS } from "@/lib/labels";
import { CLAIM_STATUSES } from "@/lib/types/enums";
import type { ClaimStatus } from "@/lib/types/enums";

export function StatusUpdater({
  claimId,
  current,
  canEdit,
}: {
  claimId: string;
  current: ClaimStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canEdit) return null;

  return (
    <Select
      value={current}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const res = await updateClaimStatus(
            claimId,
            e.target.value as ClaimStatus,
          );
          if (res.error) window.alert(res.error);
          else router.refresh();
        })
      }
      aria-label="Update status"
    >
      {CLAIM_STATUSES.map((s) => (
        <option key={s} value={s}>
          {CLAIM_STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
