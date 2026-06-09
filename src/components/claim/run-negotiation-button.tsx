"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runNegotiationAction } from "@/lib/negotiation/actions";

export function RunNegotiationButton({
  claimId,
  label = "Generate negotiation strategy",
}: {
  claimId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="brand"
      onClick={() =>
        startTransition(async () => {
          const { error } = await runNegotiationAction(claimId);
          if (error) window.alert(error);
          else router.refresh();
        })
      }
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {pending ? "Analyzing…" : label}
    </Button>
  );
}
