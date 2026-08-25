"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAddonCheckout } from "@/lib/billing/actions";

export function AddonButton({
  addonId,
  price,
  disabled,
}: {
  addonId: string;
  price: number;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          const res = await createAddonCheckout(addonId);
          if (res?.error) window.alert(res.error);
        })
      }
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {disabled ? "Non connectée" : `Acheter · ${price} €`}
    </Button>
  );
}
