import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CaseForm } from "@/components/cases/case-form";

export const metadata: Metadata = { title: "Nouveau dossier" };

export default function NewCasePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/dossiers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Mes dossiers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nouveau dossier</h1>
        <p className="text-sm text-muted-foreground">
          Renseignez la facture impayée. ClaimGuard analyse, contacte
          votre client et gère les relances jusqu&apos;au paiement — sur
          votre compte.
        </p>
      </div>

      <CaseForm />
    </div>
  );
}
