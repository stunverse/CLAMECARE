import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions & avertissement" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-2 text-lg font-semibold text-foreground">{children}</h2>
  );
}

export default function DisclaimerPage() {
  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">
        Mentions &amp; avertissement
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-foreground/90">
          <p>
            ClaimGuard assure un <strong>suivi administratif amiable</strong> de
            vos factures impayées, en votre nom. ClaimGuard{" "}
            <strong>n&apos;encaisse jamais vos paiements</strong> et n&apos;est{" "}
            <strong>ni huissier / commissaire de justice, ni société de
            recouvrement judiciaire, ni cabinet d&apos;avocats</strong>.
          </p>
        </div>

        <H2>Recouvrement amiable uniquement</H2>
        <p>
          ClaimGuard intervient exclusivement dans le cadre du{" "}
          <strong>recouvrement amiable</strong> : analyse du dossier, prise de
          contact, relances, transmission de justificatifs, suivi des promesses
          de paiement. ClaimGuard n&apos;accomplit aucun acte réservé au
          commissaire de justice (signification, saisie, exécution forcée) et
          n&apos;engage aucune procédure judiciaire.
        </p>

        <H2>Aucune garantie de résultat</H2>
        <p>
          ClaimGuard ne garantit pas le paiement effectif d&apos;une facture. Le
          règlement dépend de votre client. ClaimGuard met en œuvre des moyens
          de suivi et de relance, sans obligation de résultat.
        </p>

        <H2>Pas de conseil juridique</H2>
        <p>
          Les informations et documents fournis par ClaimGuard (y compris une
          éventuelle mise en demeure amiable ou un décompte de sommes dues) ont
          une valeur <strong>informative et administrative</strong>. Ils ne
          constituent pas un conseil juridique. Pour une analyse juridique,
          l&apos;engagement d&apos;une procédure (injonction de payer, saisie du
          tribunal) ou le recours à un commissaire de justice, adressez-vous à
          un professionnel du droit compétent.
        </p>

        <H2>Décisions et paiement direct</H2>
        <p>
          Les décisions relatives à un dossier (poursuivre, transiger, saisir la
          justice) vous appartiennent. Les sommes dues vous sont réglées{" "}
          <strong>directement sur votre compte</strong> ; ClaimGuard ne perçoit
          jamais ces montants.
        </p>

        <H2>Vérification</H2>
        <p>
          Relisez toujours les informations et documents avant leur envoi ou
          leur utilisation. ClaimGuard s&apos;appuie uniquement sur les données
          que vous fournissez et ne les invente jamais.
        </p>
      </section>
    </article>
  );
}
