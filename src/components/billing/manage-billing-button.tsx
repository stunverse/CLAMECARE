"use client";

import { useTransition } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/billing/actions";

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      const res = await createPortalSession();
      if (res?.error) window.alert(res.error);
    });
  }

  return (
    <Button variant="outline" onClick={go} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      Manage billing
    </Button>
  );
}
