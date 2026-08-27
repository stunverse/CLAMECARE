import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-2 text-lg font-semibold text-foreground">{children}</h2>
  );
}

export default function TermsPage() {
  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <H2>1. Acceptation</H2>
        <p>
          En créant un compte ou en utilisant MyDueGuard, vous acceptez les
          présentes Conditions d&apos;utilisation, la Politique de
          confidentialité et les Mentions &amp; avertissement.
        </p>

        <H2>2. Nature du service</H2>
        <p>
          MyDueGuard est un assistant de <strong>suivi administratif amiable</strong>{" "}
          des factures impayées, destiné aux travailleurs indépendants
          (freelances, consultants, prestataires, sous-traitants, etc.).
          MyDueGuard agit <strong>au nom et pour le compte</strong> de
          l&apos;utilisateur, dans le cadre du mandat d&apos;intervention qu&apos;il
          accepte.
        </p>
        <p>
          MyDueGuard <strong>n&apos;est ni un huissier / commissaire de justice,
          ni une société de recouvrement judiciaire, ni un cabinet
          d&apos;avocats</strong>, et ne fournit pas de conseil juridique.
          MyDueGuard n&apos;accomplit aucun acte d&apos;exécution forcée et
          n&apos;engage aucune procédure judiciaire : ces décisions
          appartiennent exclusivement à l&apos;utilisateur.
        </p>

        <H2>3. MyDueGuard n&apos;encaisse jamais vos paiements</H2>
        <p>
          Les sommes dues par votre client vous sont réglées{" "}
          <strong>directement, sur votre propre compte bancaire</strong>.
          MyDueGuard ne perçoit, ne détient et ne fait jamais transiter les
          montants de vos factures, et ne communique jamais d&apos;autre compte
          que le vôtre.
        </p>

        <H2>4. Mandat d&apos;intervention</H2>
        <p>
          Vous autorisez MyDueGuard à effectuer, à l&apos;amiable et en votre
          nom, le suivi et la relance de vos factures auprès de vos clients
          (envoi d&apos;emails, relances, transmission de justificatifs). Vous
          pouvez suspendre ou retirer ce mandat à tout moment depuis votre
          espace.
        </p>

        <H2>5. Vos responsabilités</H2>
        <p>
          Vous êtes responsable de l&apos;exactitude des informations et
          documents que vous déposez (factures, montants, coordonnées,
          justificatifs). MyDueGuard s&apos;appuie sur ces éléments et ne les
          invente jamais. Vous restez responsable de la relation commerciale
          avec vos clients et des suites que vous décidez de donner à un dossier.
        </p>

        <H2>6. Comptes et sécurité</H2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et de
          toute activité réalisée depuis votre compte. Prévenez-nous sans délai
          en cas d&apos;utilisation non autorisée.
        </p>

        <H2>7. Abonnement</H2>
        <p>
          L&apos;accès à MyDueGuard peut être payant selon la formule choisie.
          Les paiements de l&apos;abonnement sont <strong>strictement distincts</strong>{" "}
          des montants des factures que vous cherchez à recouvrer : ils ne se
          confondent jamais. Les conditions tarifaires sont présentées lors de
          la souscription.
        </p>

        <H2>8. Limitation de responsabilité</H2>
        <p>
          MyDueGuard fournit un outil d&apos;assistance et ne garantit aucun
          résultat, notamment pas le paiement effectif d&apos;une facture. Dans
          les limites permises par la loi, MyDueGuard ne saurait être tenu
          responsable des décisions de vos clients ni des suites judiciaires que
          vous engageriez.
        </p>

        <H2>9. Modification et résiliation</H2>
        <p>
          Vous pouvez fermer votre compte à tout moment. Nous pouvons faire
          évoluer ces conditions ; les changements substantiels vous seront
          signalés.
        </p>

        <H2>10. Contact</H2>
        <p>
          Pour toute question relative à ces conditions, contactez-nous depuis
          la page Support de votre espace.
        </p>
      </section>
    </article>
  );
}
