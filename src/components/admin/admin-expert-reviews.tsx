"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateExpertReviewStatus } from "@/lib/expert/actions";
import {
  EXPERT_REVIEW_TYPE_LABELS,
  EXPERT_REVIEW_STATUS_LABELS,
} from "@/lib/labels";
import { EXPERT_REVIEW_STATUSES } from "@/lib/types/enums";
import { formatDate } from "@/lib/format";
import type { ExpertReview, ExpertReviewStatus } from "@/lib/types";

export function AdminExpertReviews({
  reviews,
  canEdit,
}: {
  reviews: ExpertReview[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (reviews.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        No expert review requests.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {EXPERT_REVIEW_TYPE_LABELS[r.review_type]}
              </p>
              {r.user_note && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.user_note}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(r.created_at)}
              </p>
            </div>
            {canEdit ? (
              <Select
                value={r.status}
                className="w-48"
                onChange={(e) =>
                  startTransition(async () => {
                    await updateExpertReviewStatus({
                      id: r.id,
                      status: e.target.value as ExpertReviewStatus,
                    });
                    router.refresh();
                  })
                }
              >
                {EXPERT_REVIEW_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {EXPERT_REVIEW_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            ) : (
              <Badge variant="info">
                {EXPERT_REVIEW_STATUS_LABELS[r.status]}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
