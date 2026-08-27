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
          MyDue<span className="text-brand">Guard</span>
        </span>
      </Link>

      <div className="w-full max-w-md space-y-4">
        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
            L&apos;authentification n&apos;est pas encore connectée. Ajoutez vos
            clés Supabase dans{" "}
            <code className="rounded bg-muted px-1">.env.local</code> pour
            activer la connexion.
          </div>
        )}
        {children}
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        MyDueGuard assure le suivi administratif de vos factures impayées.
        MyDueGuard n&apos;encaisse jamais vos paiements : votre client vous
        règle directement.
      </p>
    </div>
  );
}
