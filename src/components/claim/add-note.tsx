"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClaimNote } from "@/lib/claims/manage-actions";

export function AddNote({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await addClaimNote(claimId, note);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNote("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add note
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to this claim's activity log…"
          className="min-h-20"
          autoFocus
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={pending || !note.trim()}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save note
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
