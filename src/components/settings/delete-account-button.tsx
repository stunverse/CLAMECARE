"use client";

import { deleteAccount } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "This permanently deletes your account, claims, and documents. This cannot be undone. Continue?",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button variant="destructive" type="submit">
        Delete my account
      </Button>
    </form>
  );
}
