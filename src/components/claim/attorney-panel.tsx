"use client";

import { useState, useTransition } from "react";
import {
  Scale,
  Sparkles,
  Loader2,
  Printer,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import {
  generateAttorneySummaryAction,
  setAttorneyConsent,
} from "@/lib/attorney/actions";

function printText(title: string, body: string) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const esc = (x: string) =>
    x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.write(
    `<!doctype html><html><head><title>${esc(title)}</title><style>@page{margin:1in}body{font-family:Georgia,serif;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit;font-size:12pt}</style></head><body><pre>${esc(body)}</pre><script>window.onload=function(){window.print()}</script></body></html>`,
  );
  w.document.close();
}

export function AttorneyPanel({
  claimId,
  recommendation,
  canPersist,
  initialConsent,
  state,
}: {
  claimId: string;
  recommendation: { should: boolean; reasons: string[] };
  canPersist: boolean;
  initialConsent: boolean;
  state: string | null;
}) {
  const [text, setText] = useState("");
  const [generating, startGenerate] = useTransition();
  const [consent, setConsent] = useState(initialConsent);
  const [savingConsent, startConsent] = useTransition();

  function generate() {
    startGenerate(async () => {
      const res = await generateAttorneySummaryAction(claimId);
      if (res.text) setText(res.text);
    });
  }

  function toggleConsent(next: boolean) {
    setConsent(next);
    startConsent(async () => {
      const res = await setAttorneyConsent(claimId, next);
      if (res.error) {
        setConsent(!next);
        window.alert(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Recommendation */}
      <Card className={recommendation.should ? "border-warning/40" : undefined}>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <Scale className="size-4 text-brand" />
          <CardTitle className="text-base">Do you need an attorney?</CardTitle>
          {recommendation.should && <Badge variant="warning">Worth considering</Badge>}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {recommendation.should ? (
            <p>
              Based on the information provided, you may want to consult a
              licensed attorney about this claim. ClaimCare AI is not a law firm
              and cannot give legal advice.
            </p>
          ) : (
            <p>
              Your claim isn&apos;t currently flagged as needing an attorney, but
              you can still consult one at any time. ClaimCare AI is not a law
              firm and cannot give legal advice.
            </p>
          )}
          {recommendation.reasons.length > 0 && (
            <ul className="space-y-1">
              {recommendation.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Attorney summary */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Attorney summary</CardTitle>
          <Button variant="brand" size="sm" onClick={generate} disabled={generating}>
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {text ? "Regenerate" : "Generate summary"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A neutral case summary you can bring to any licensed attorney of your
            choice for an initial consultation.
          </p>
          {text && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[24rem] w-full rounded-lg border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => printText("Attorney summary", text)}
                >
                  <Printer className="size-4" />
                  Print / Save as PDF
                </Button>
                <CopyButton text={text} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Find an attorney (dormant referral) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <UserCheck className="size-4 text-brand" />
          <CardTitle className="text-base">Find an attorney</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {state
              ? `We don't have partner attorneys in ${state} yet.`
              : "We don't have partner attorneys in your state yet."}{" "}
            In the meantime, you can bring the summary above to any licensed
            attorney, or search your state bar association&apos;s referral
            service.
          </p>
          {canPersist && (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consent}
                disabled={savingConsent}
                onChange={(e) => toggleConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-[var(--brand)]"
              />
              <span>
                Notify me if a partner attorney becomes available in my state.
                You can withdraw this at any time.
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      <DisclaimerBanner variant="primary" />
    </div>
  );
}
