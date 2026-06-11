"use client";

import { useState, useTransition } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { requestExpertReview } from "@/lib/expert/actions";
import {
  EXPERT_REVIEW_TYPE_LABELS,
  EXPERT_REVIEW_STATUS_LABELS,
  EXPERT_REVIEW_STATUS_VARIANT,
} from "@/lib/labels";
import { EXPERT_REVIEW_TYPES } from "@/lib/types/enums";
import { formatDate } from "@/lib/format";
import type { ExpertReview, ExpertReviewType } from "@/lib/types";

export function ExpertReviewCard({
  claimId,
  canRequest,
  initialReviews,
}: {
  claimId: string;
  canRequest: boolean;
  initialReviews: ExpertReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [open, setOpen] = useState(false);
  const [reviewType, setReviewType] =
    useState<ExpertReviewType>("appeal_letter");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const res = await requestExpertReview({ claimId, reviewType, note });
      if (res.error || !res.review) {
        setError(res.error ?? "Could not submit.");
        return;
      }
      setReviews((r) => [res.review!, ...r]);
      setNote("");
      setOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 pb-3">
        <UserCheck className="size-4 text-brand" />
        <CardTitle className="text-base">Human expert review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.length > 0 && (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {EXPERT_REVIEW_TYPE_LABELS[r.review_type]}
                  </span>
                  <Badge variant={EXPERT_REVIEW_STATUS_VARIANT[r.status]}>
                    {EXPERT_REVIEW_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(r.created_at)}
                </p>
                {r.expert_summary && (
                  <p className="mt-1 text-sm">{r.expert_summary}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!canRequest ? (
          <p className="text-sm text-muted-foreground">
            A specialist can review your appeal, evidence, strategy, or
            complaint. Connect Supabase to request one.
          </p>
        ) : open ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>What would you like reviewed?</Label>
              <Select
                value={reviewType}
                onChange={(e) =>
                  setReviewType(e.target.value as ExpertReviewType)
                }
              >
                {EXPERT_REVIEW_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EXPERT_REVIEW_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything specific you'd like the expert to focus on?"
              className="min-h-20"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Submit request
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Request a review
          </Button>
        )}

        <DisclaimerBanner variant="expertReview" />
      </CardContent>
    </Card>
  );
}
