import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { OrDivider } from "@/components/auth/or-divider";
import { FormMessage } from "@/components/auth/form-message";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google sign-in isn't connected yet.",
  oauth: "We couldn't start Google sign-in. Please try again.",
  auth_callback: "We couldn't complete sign-in. Please try again.",
  delete_unavailable:
    "You've been signed out. Account deletion needs admin configuration — please contact support to finish.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const redirectTo =
    typeof sp.redirectTo === "string" ? sp.redirectTo : undefined;
  const error = sp.error ? ERROR_MESSAGES[sp.error] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your ClaimCare AI account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormMessage error={error} />}
        <GoogleButton label="Sign in with Google" />
        <OrDivider />
        <LoginForm redirectTo={redirectTo} />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
