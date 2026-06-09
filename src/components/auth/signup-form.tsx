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
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
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
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
        <ConsentCheckbox name="accept_terms">
          I agree to the{" "}
          <Link href="/terms" className="text-brand hover:underline">
            Terms of Service
          </Link>
          .
        </ConsentCheckbox>
        <ConsentCheckbox name="accept_privacy">
          I agree to the{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            Privacy Policy
          </Link>{" "}
          and to ClaimCare AI processing my uploaded documents.
        </ConsentCheckbox>
        <ConsentCheckbox name="accept_disclaimer">
          I understand ClaimCare AI provides{" "}
          <Link href="/disclaimer" className="text-brand hover:underline">
            informational assistance only
          </Link>{" "}
          and is not a law firm.
        </ConsentCheckbox>
      </div>

      <FormMessage error={state.error} success={state.success} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
