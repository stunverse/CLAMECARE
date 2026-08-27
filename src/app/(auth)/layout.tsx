import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-6 flex items-center">
        <BrandLogo className="h-16" />
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
