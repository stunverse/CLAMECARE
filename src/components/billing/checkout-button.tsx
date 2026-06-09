"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/billing/actions";
import type { SubscriptionPlan } from "@/lib/types/enums";

export function CheckoutButton({
  plan,
  interval,
  label = "Choose plan",
  variant = "default",
  disabled,
}: {
  plan: SubscriptionPlan;
  interval: "monthly" | "yearly";
  label?: string;
  variant?: "default" | "brand" | "outline";
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      const res = await createCheckoutSession({ plan, interval });
      if (res?.error) window.alert(res.error);
    });
  }

  return (
    <Button
      variant={variant}
      className="w-full"
      onClick={go}
      disabled={pending || disabled}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}
