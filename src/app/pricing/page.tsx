import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PricingTable } from "@/components/billing/pricing-table";
import { buttonVariants } from "@/components/ui/button";
import { isStripeConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tarifs" };

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Claim<span className="text-brand">Guard</span>
            </span>
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Connexion
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Des tarifs simples et transparents
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Choisissez la formule adaptée à votre volume de dossiers. Changez ou
            résiliez à tout moment.
          </p>
        </div>

        <PricingTable mode="marketing" stripeConfigured={isStripeConfigured} />

        <p className="mx-auto mt-10 max-w-3xl rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          L&apos;abonnement ClaimGuard rémunère le service de suivi. Il est
          distinct des montants de vos factures : ClaimGuard n&apos;encaisse
          jamais les sommes que vos clients vous doivent.
        </p>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} ClaimGuard. Suivi amiable, jamais
          d&apos;encaissement.
        </div>
      </footer>
    </div>
  );
}
