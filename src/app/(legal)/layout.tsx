import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <BrandLogo className="text-xl" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} MyDueGuard. Suivi amiable, jamais
            d&apos;encaissement.
          </p>
          <nav className="flex gap-4">
            <Link href="/disclaimer" className="hover:text-foreground">
              Mentions
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Conditions
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
