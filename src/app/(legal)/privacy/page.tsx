import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-2 text-lg font-semibold text-foreground">{children}</h2>
  );
}

export default function PrivacyPage() {
  return (
    <article className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      <section className="space-y-3 text-sm leading-relaxed text-foreground/90">
        <H2>1. Données que nous traitons</H2>
        <p>
          Pour assurer le suivi de vos factures, nous traitons : vos
          informations de compte et de profil professionnel (nom, email,
          téléphone, nom commercial, SIREN/SIRET, adresse, statut), vos
          coordonnées de paiement (titulaire, IBAN/BIC — utilisées uniquement
          pour être communiquées à vos clients), les données de vos dossiers
          (factures, montants, échéances, justificatifs) et les échanges
          d&apos;emails liés à chaque dossier.
        </p>

        <H2>2. Finalités</H2>
        <p>
          Ces données servent exclusivement à : analyser vos dossiers, contacter
          vos clients en votre nom à l&apos;amiable, gérer les relances et le
          suivi des paiements, vous informer, et assurer la sécurité et le bon
          fonctionnement du service. Nous n&apos;utilisons pas vos documents à
          d&apos;autres fins.
        </p>

        <H2>3. Base légale</H2>
        <p>
          Le traitement repose sur l&apos;exécution du contrat qui nous lie
          (fourniture du service et mandat d&apos;intervention), sur votre
          consentement pour le traitement des documents déposés, et sur nos
          obligations légales.
        </p>

        <H2>4. Traitement par l&apos;IA</H2>
        <p>
          Certaines opérations de <strong>lecture, extraction, classification et
          résumé</strong> peuvent s&apos;appuyer sur des modèles d&apos;IA. L&apos;IA
          ne décide jamais seule d&apos;une action et n&apos;invente aucune donnée :
          chaque information transmise à un client provient de vos documents ou
          de vos saisies.
        </p>

        <H2>5. Sécurité</H2>
        <p>
          Vos documents sont stockés de manière privée et ne sont accessibles
          qu&apos;à vous (et, si nécessaire, à notre équipe pour une intervention
          humaine sur un dossier). L&apos;accès aux fichiers se fait via des liens
          signés à durée limitée. Un cloisonnement strict empêche
          l&apos;accès aux dossiers d&apos;un autre utilisateur.
        </p>

        <H2>6. Partage</H2>
        <p>
          Nous ne vendons pas vos données. Nous les partageons uniquement avec
          les prestataires techniques nécessaires au service (hébergement,
          envoi d&apos;emails, paiement de l&apos;abonnement), tenus à la
          confidentialité. Les emails de suivi sont adressés à vos clients dans
          le cadre de votre mandat.
        </p>

        <H2>7. Conservation</H2>
        <p>
          Vos données sont conservées le temps nécessaire au suivi de vos
          dossiers puis selon les durées légales applicables. Vous pouvez
          demander la suppression d&apos;un document ou de votre compte.
        </p>

        <H2>8. Vos droits</H2>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
          rectification, d&apos;effacement, de portabilité et d&apos;opposition.
          Vous pouvez exporter vos données ou supprimer votre compte depuis
          votre espace, ou nous contacter via la page Support.
        </p>

        <H2>9. Contact</H2>
        <p>
          Pour toute question relative à vos données, contactez-nous depuis la
          page Support de votre espace.
        </p>
      </section>
    </article>
  );
}
