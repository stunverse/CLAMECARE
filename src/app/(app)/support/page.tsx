import type { Metadata } from "next";
import { getUserTickets } from "@/lib/data/support";
import { SupportClient } from "@/components/support/support-client";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Support" };

const FAQ = [
  {
    q: "MyDueGuard est-il un huissier ou un cabinet d'avocats ?",
    a: "Non. MyDueGuard assure un suivi administratif amiable de vos factures, en votre nom. Il n'encaisse jamais vos paiements et n'est ni huissier / commissaire de justice, ni cabinet d'avocats. Pour un conseil juridique, consultez un professionnel du droit.",
  },
  {
    q: "Comment fonctionne l'analyse IA ?",
    a: "Elle lit vos documents pour en extraire les informations clés (numéro, montant, échéance), classe les réponses de vos clients et prépare des brouillons. L'IA n'invente jamais une donnée et ne décide jamais seule d'une action.",
  },
  {
    q: "Comment MyDueGuard contacte-t-il mes clients ?",
    a: "Sur la base du mandat que vous acceptez, MyDueGuard envoie des relances amiables en votre nom et suit les réponses. Vous pouvez suspendre l'automatisation d'un dossier à tout moment.",
  },
  {
    q: "Comment suis-je payé ?",
    a: "Votre client vous règle directement sur votre propre compte bancaire. MyDueGuard ne perçoit et ne fait jamais transiter les sommes qui vous sont dues.",
  },
  {
    q: "Mes documents restent-ils confidentiels ?",
    a: "Oui. Vos documents sont stockés de manière privée, cloisonnés à votre compte, avec des accès par liens signés à durée limitée.",
  },
  {
    q: "Puis-je résilier mon abonnement ?",
    a: "Oui. Rendez-vous dans Facturation puis « Gérer la facturation » pour changer de formule ou résilier à tout moment.",
  },
];

export default async function SupportPage() {
  const { tickets, isDemo } = await getUserTickets();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Aide &amp; support</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Trouvez une réponse ou contactez notre équipe.
      </p>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Questions fréquentes</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <SupportClient initialTickets={tickets} canSubmit={!isDemo} />
    </div>
  );
}
