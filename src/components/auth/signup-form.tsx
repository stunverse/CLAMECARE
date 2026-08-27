"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

function ConsentCheckbox({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        name={name}
        required
        className="mt-0.5 size-4 rounded border-input accent-[var(--brand)]"
      />
      <span>{children}</span>
    </label>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom</Label>
          <Input id="first_name" name="first_name" autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input id="last_name" name="last_name" autoComplete="family-name" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="8 caractères minimum"
          required
        />
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
        <ConsentCheckbox name="accept_terms">
          J&apos;accepte les{" "}
          <Link href="/terms" className="text-brand hover:underline">
            Conditions d&apos;utilisation
          </Link>
          .
        </ConsentCheckbox>
        <ConsentCheckbox name="accept_privacy">
          J&apos;accepte la{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            Politique de confidentialité
          </Link>{" "}
          et le traitement par MyDueGuard des documents que je dépose.
        </ConsentCheckbox>
        <ConsentCheckbox name="accept_disclaimer">
          Je comprends que MyDueGuard assure un{" "}
          <Link href="/disclaimer" className="text-brand hover:underline">
            suivi administratif amiable
          </Link>
          , n&apos;encaisse jamais mes paiements et n&apos;est ni huissier ni
          cabinet juridique.
        </ConsentCheckbox>
      </div>

      <FormMessage error={state.error} success={state.success} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Création du compte…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
