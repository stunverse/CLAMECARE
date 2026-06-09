import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          ClaimCare<span className="text-brand"> AI</span>
        </span>
      </Link>

      <div className="w-full max-w-md space-y-4">
        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
            Authentication isn&apos;t connected yet. Add your Supabase keys to{" "}
            <code className="rounded bg-muted px-1">.env.local</code> to enable
            sign in.
          </div>
        )}
        {children}
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        ClaimCare AI provides informational assistance only and is not a law
        firm. It does not provide legal advice.
      </p>
    </div>
  );
}
