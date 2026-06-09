import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();

  // Placeholder mode: Supabase not connected yet.
  if (!supabase) {
    return (
      <SettingsShell>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Connect Supabase to manage your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </SettingsShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "—";

  return (
    <SettingsShell>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </div>
          <SignOutButton />
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" value={fullName} />
          <Field label="Email" value={profile?.email ?? user.email ?? "—"} />
          <Field label="State" value={profile?.state ?? "—"} />
          <Field label="Country" value={profile?.country ?? "USA"} />
        </CardContent>
      </Card>

      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated claims and
            documents. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>

      <DisclaimerBanner variant="primary" />
    </SettingsShell>
  );
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">
            ClaimCare<span className="text-brand"> AI</span>
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </header>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
      <Separator className="mt-3" />
    </div>
  );
}
