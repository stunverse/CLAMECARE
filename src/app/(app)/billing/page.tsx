import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { getBillingData } from "@/lib/billing/data";
import { PLAN_BY_ID } from "@/lib/billing/plans";
import { PricingTable } from "@/components/billing/pricing-table";
import { UsageLimitBanner } from "@/components/billing/usage-limit-banner";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { AddonButton } from "@/components/billing/addon-button";
import { ADDONS } from "@/lib/billing/addons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLAN_LABELS } from "@/lib/labels";
import { formatDateFr } from "@/lib/cases/format";

export const metadata: Metadata = { title: "Facturation" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    addon?: string;
    welcome?: string;
    subscribe?: string;
  }>;
}) {
  const sp = await searchParams;
  const billing = await getBillingData();
  const plan = PLAN_BY_ID[billing.plan];
  const hasActiveSub =
    billing.subscription?.status === "active" ||
    billing.subscription?.status === "trialing";
  const needsPlan = !hasActiveSub;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {needsPlan ? "Choisissez votre formule" : "Facturation"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {needsPlan
          ? "Un abonnement est nécessaire pour utiliser MyDueGuard. Sélectionnez la formule adaptée à votre volume de dossiers — vous pourrez en changer ou résilier à tout moment."
          : "Gérez votre formule et votre consommation MyDueGuard."}
      </p>

      {sp.subscribe && needsPlan && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            Pour accéder à vos dossiers et aux relances, choisissez une formule
            ci-dessous. Votre abonnement rémunère le service de suivi ; il est
            distinct des montants que vos clients vous doivent.
          </span>
        </div>
      )}

      {sp.welcome && needsPlan && !sp.subscribe && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            Bienvenue sur MyDueGuard ! Dernière étape : choisissez la formule
            qui vous convient ci-dessous pour activer votre espace et commencer
            à suivre vos impayés.
          </span>
        </div>
      )}

      {sp.success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          Votre abonnement est actif. Merci !
        </div>
      )}
      {sp.addon && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          Votre achat a bien été pris en compte. Merci !
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current plan */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Formule actuelle</CardTitle>
            <Badge variant={hasActiveSub ? "info" : "warning"}>
              {hasActiveSub
                ? SUBSCRIPTION_PLAN_LABELS[billing.plan]
                : "Aucun abonnement"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasActiveSub ? (
              <>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                {billing.subscription?.current_period_end && (
                  <p className="text-sm">
                    Renouvellement le{" "}
                    <span className="font-medium">
                      {formatDateFr(billing.subscription.current_period_end)}
                    </span>
                    {billing.subscription.cancel_at_period_end &&
                      " · résiliation en fin de période"}
                  </p>
                )}
                <ManageBillingButton />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore d&apos;abonnement actif. Choisissez
                une formule ci-dessous pour accéder à MyDueGuard et suivre vos
                factures impayées.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consommation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageLimitBanner
              label="Dossiers actifs"
              used={billing.usage.activeClaims}
              limit={billing.quota.active_claims_limit}
            />
            <UsageLimitBanner
              label="Documents générés"
              used={billing.usage.generatedDocuments}
              limit={billing.quota.generated_documents_limit}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Formules</h2>
        <PricingTable
          mode="manage"
          currentPlan={hasActiveSub ? billing.plan : undefined}
          stripeConfigured={billing.stripeConfigured}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Options</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Achats ponctuels pour un accompagnement supplémentaire sur un dossier.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADDONS.map((addon) => (
            <Card key={addon.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{addon.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {addon.description}
                  </p>
                </div>
                <AddonButton
                  addonId={addon.id}
                  price={addon.price}
                  disabled={!billing.stripeConfigured}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-8 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Votre abonnement MyDueGuard rémunère le service de suivi. Il est
        totalement distinct des montants de vos factures : MyDueGuard n&apos;encaisse
        jamais les sommes que vos clients vous doivent.
      </p>
    </div>
  );
}
