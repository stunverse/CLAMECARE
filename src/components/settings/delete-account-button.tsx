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
            "Ceci supprime définitivement votre compte, vos dossiers et vos documents. Cette action est irréversible. Continuer ?",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button variant="destructive" type="submit">
        Supprimer mon compte
      </Button>
    </form>
  );
}
