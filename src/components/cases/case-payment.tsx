"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, CalendarClock } from "lucide-react";
import {
  confirmPayment,
  reportPaymentNotReceived,
} from "@/lib/cases/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEuro, formatDateFr } from "@/lib/cases/format";
import type { PaymentType } from "@/lib/claimguard/enums";

export function CasePayment({
  caseId,
  status,
  outstanding,
  promisedDate,
}: {
  caseId: string;
  status: string;
  outstanding: number | null;
  promisedDate: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [amount, setAmount] = useState(outstanding ? String(outstanding) : "");
  const [paidAt, setPaidAt] = useState("");
  const [type, setType] = useState<PaymentType>("full");
  const [error, setError] = useState<string | null>(null);

  const isPaid = status === "paid" || status === "closed";
  const awaitingPromise = ["payment_promised", "payment_due", "payment_overdue"].includes(
    status,
  );

  function submitConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmPayment({
        caseId,
        amount: amount ? Number(amount.replace(",", ".")) : null,
        paidAt: paidAt || null,
        type,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  function submitNotReceived() {
    startTransition(async () => {
      await reportPaymentNotReceived(caseId);
      router.refresh();
    });
  }

  if (isPaid) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        <CheckCircle2 className="size-4" />
        Paiement confirmé — dossier {status === "closed" ? "clôturé" : "réglé"}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {promisedDate && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Paiement annoncé pour le {formatDateFr(promisedDate)}
        </p>
      )}

      {awaitingPromise && !confirming && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Avez-vous reçu le paiement{" "}
            {outstanding ? `de ${formatEuro(outstanding)}` : ""} ?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => setConfirming(true)}
              disabled={pending}
            >
              <CheckCircle2 className="size-4" />
              Oui, paiement reçu
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={submitNotReceived}
              disabled={pending}
            >
              <XCircle className="size-4" />
              Non, toujours pas
            </Button>
          </div>
        </div>
      )}

      {!awaitingPromise && !confirming && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setConfirming(true)}
          disabled={pending}
        >
          <CheckCircle2 className="size-4" />
          Marquer comme payé
        </Button>
      )}

      {confirming && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="pay-type">Type de paiement</Label>
            <Select
              id="pay-type"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
            >
              <option value="full">Paiement total</option>
              <option value="partial">Paiement partiel</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Montant reçu (€)</Label>
              <Input
                id="pay-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={outstanding ? String(outstanding) : "0"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">Date</Label>
              <Input
                id="pay-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={submitConfirm}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
