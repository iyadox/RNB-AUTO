import type { Metadata } from "next";
import { PageHero, Prose, Section, ToComplete } from "@/components/public/page-blocks";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { PHOTO_LIMITS } from "@/core/photos";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données RNB AUTO collecte lors d'une demande de dépannage, pourquoi, combien de temps, et vos droits.",
  alternates: { canonical: "/confidentialite" },
};

export default async function PrivacyPage() {
  const info = await getPublicSiteInfo();
  const contact = info.email ? <a href={`mailto:${info.email}`}>{info.email}</a> : <ToComplete label="email de contact" />;
  return (
    <>
      <PageHero
        eyebrow="Vos données"
        title="Politique de confidentialité"
        lead="Nous collectons uniquement ce qui est utile pour vous dépanner. Voici lesquelles, pourquoi et pendant combien de temps."
      />
      <Section tone="darker">
        <Prose>
          <h2>Qui est responsable de vos données ?</h2>
          <p>
            {info.legal.companyName ?? info.name}, {info.legal.address ?? info.depotLabel}. Contact : {contact}.
          </p>

          <h2>Quelles données ?</h2>
          <ul>
            <li>Vos coordonnées : nom ou prénom, numéro de téléphone, et email si vous le donnez.</li>
            <li>
              Le lieu de prise en charge et la destination. Si vous appuyez sur « Utiliser ma position », votre position est
              lue une seule fois par votre navigateur, avec votre accord.
            </li>
            <li>Les informations sur le véhicule et la panne : type, marque, modèle, immatriculation si vous la donnez.</li>
            <li>
              Les photos du véhicule que vous choisissez d&apos;ajouter après votre demande. Votre téléphone les réduit avant
              l&apos;envoi et leurs informations cachées (dont la position GPS) sont retirées. Elles ne sont jamais publiques.
            </li>
            <li>Les messages et photos que vous choisissez de nous envoyer sur WhatsApp.</li>
            <li>
              Des données techniques limitées (adresse IP, date et heure) utilisées pour protéger le site contre les abus.
            </li>
          </ul>

          <h2>Pourquoi ?</h2>
          <ul>
            <li>Calculer une estimation, vous rappeler et organiser l&apos;intervention (mesures précontractuelles et contrat).</li>
            <li>Établir les documents comptables obligatoires (obligation légale).</li>
            <li>Assurer la sécurité du site et éviter les demandes abusives (intérêt légitime).</li>
          </ul>
          <p>Vos données ne sont jamais vendues ni utilisées pour de la publicité.</p>

          <h2>Qui y a accès ?</h2>
          <p>
            Uniquement {info.name}, et les prestataires techniques nécessaires au fonctionnement du site : hébergement, envoi
            d&apos;emails, calcul des adresses et des itinéraires (les adresses saisies sont transmises à ce service pour
            calculer les distances). Ces prestataires n&apos;utilisent pas vos données pour leur propre compte.
          </p>

          <h2>Combien de temps ?</h2>
          <ul>
            <li>Estimations non suivies d&apos;une demande : supprimées au bout de 30 jours.</li>
            <li>Photos du véhicule : supprimées {PHOTO_LIMITS.retentionMonths} mois après la fin de l&apos;intervention.</li>
            <li>Demandes et interventions : 3 ans après le dernier contact.</li>
            <li>Documents comptables : 10 ans, comme l&apos;exige la loi.</li>
          </ul>

          <h2>Cookies et stockage</h2>
          <p>
            Le site public n&apos;utilise aucun cookie publicitaire ni de mesure d&apos;audience. Votre navigateur garde
            temporairement votre saisie en cours de demande pour ne pas la perdre en cas de coupure ; elle s&apos;efface
            lorsque vous fermez l&apos;onglet. L&apos;espace réservé à RNB AUTO utilise un cookie de connexion indispensable.
          </p>

          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander à accéder à vos données, les corriger, les supprimer, limiter leur utilisation ou vous y
            opposer, ainsi que les récupérer. Écrivez-nous : {contact}. Si vous estimez que vos droits ne sont pas respectés,
            vous pouvez saisir la CNIL (cnil.fr).
          </p>
        </Prose>
      </Section>
    </>
  );
}
