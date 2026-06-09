import { Phone, Mail, MessageSquareWarning, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import {
  NEGOTIATION_RECOMMENDATION_LABELS,
  type NegotiationResult,
  type NegotiationRecommendation,
} from "@/lib/ai/negotiation";
import { formatCurrency } from "@/lib/format";
import type { StatusVariant } from "@/lib/labels";

const REC_VARIANT: Record<NegotiationRecommendation, StatusVariant> = {
  accept: "success",
  negotiate: "info",
  request_clarification: "warning",
  request_independent_review: "warning",
  escalate: "warning",
  consult_attorney: "danger",
};

export function NegotiationView({ result }: { result: NegotiationResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            Offer assessment
            <Badge variant={REC_VARIANT[result.recommendation]}>
              {NEGOTIATION_RECOMMENDATION_LABELS[result.recommendation]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="leading-relaxed">{result.offer_assessment}</p>
          {result.recommended_counteroffer !== null && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/50 p-3">
              <Target className="size-5 text-brand" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  You may consider requesting
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(result.recommended_counteroffer)}
                </p>
              </div>
            </div>
          )}
          <p className="text-muted-foreground">{result.justification}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Talking points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {result.talking_points.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-brand" />
              Email response
            </CardTitle>
            <CopyButton text={result.email_response} />
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
              {result.email_response}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4 text-brand" />
              Phone script
            </CardTitle>
            <CopyButton text={result.phone_script} />
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
              {result.phone_script}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <MessageSquareWarning className="size-4 text-warning" />
          <CardTitle className="text-base">Responses to objections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.objection_responses.map((o, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{o.objection}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.response}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
