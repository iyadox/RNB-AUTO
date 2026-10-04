import type { Metadata } from "next";
import { Prose } from "@/components/public/page-blocks";
import { Chantier, Durations, LegalSection, SignList } from "@/components/pages/legal/legal-objects";
import { LegalShell, type TocEntry } from "@/components/pages/legal/legal-shell";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { PHOTO_LIMITS } from "@/core/photos";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données RNB AUTO collecte lors d'une demande de dépannage, pourquoi, combien de temps, et vos droits.",
  alternates: { canonical: "/confidentialite" },
};

const TOC: readonly TocEntry[] = [
  { id: "responsable", label: "Qui est responsable de vos données ?", num: "01" },
  { id: "donnees", label: "Quelles données ?", num: "02" },
  { id: "pourquoi", label: "Pourquoi ?", num: "03" },
  { id: "acces", label: "Qui y a accès ?", num: "04" },
  { id: "durees", label: "Combien de temps ?", num: "05" },
  { id: "cookies", label: "Cookies et stockage", num: "06" },
  { id: "droits", label: "Vos droits", num: "07" },
];

/**
 * /confidentialite « L'entrée d'agglomération » (docs/09, F.9). Textes repris mot pour mot ;
 * les durées de conservation sont celles appliquées par l'entretien automatique
 * (src/server/maintenance.ts) et `PHOTO_LIMITS`.
 */
export default async function PrivacyPage() {
  const info = await getPublicSiteInfo();
  const contact = info.email ? <a href={`mailto:${info.email}`}>{info.email}</a> : <Chantier label="email de contact" />;
  return (
    <LegalShell
      eyebrow="Vos données"
      pictogram="lock"
      title="Politique de confidentialité"
      lead="Nous collectons uniquement ce qui est utile pour vous dépanner. Voici lesquelles, pourquoi et pendant combien de temps."
      toc={TOC}
    >
      <LegalSection id="responsable" num="01" title="Qui est responsable de vos données ?">
        <Prose>
          <p>
            {info.legal.companyName ?? info.name}, {info.legal.address ?? info.depotLabel}. Contact : {contact}.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="donnees" num="02" title="Quelles données ?">
        <SignList
          items={[
            {
              key: "coordonnees",
              icon: "user",
              content: "Vos coordonnées : nom ou prénom, numéro de téléphone, et email si vous le donnez.",
            },
            {
              key: "lieux",
              icon: "pin",
              content: (
                <>
                  Le lieu de prise en charge et la destination. Si vous appuyez sur « Utiliser ma position », votre position
                  est lue une seule fois par votre navigateur, avec votre accord.
                </>
              ),
            },
            {
              key: "vehicule",
              icon: "engine",
              content: "Les informations sur le véhicule et la panne : type, marque, modèle, immatriculation si vous la donnez.",
            },
            {
              key: "photos",
              icon: "camera",
              content: (
                <>
                  Les photos du véhicule que vous choisissez d&apos;ajouter après votre demande. Votre téléphone les réduit avant
                  l&apos;envoi et leurs informations cachées (dont la position GPS) sont retirées. Elles ne sont jamais publiques.
                </>
              ),
            },
            {
              key: "whatsapp",
              icon: "image",
              content: "Les messages et photos que vous choisissez de nous envoyer sur WhatsApp.",
            },
            {
              key: "techniques",
              icon: "shield",
              content: "Des données techniques limitées (adresse IP, date et heure) utilisées pour protéger le site contre les abus.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="pourquoi" num="03" title="Pourquoi ?">
        <SignList
          items={[
            {
              key: "intervention",
              icon: "route",
              content: (
                <>
                  Calculer une estimation, vous rappeler et organiser l&apos;intervention (mesures précontractuelles et contrat).
                </>
              ),
            },
            { key: "comptables", icon: "note", content: "Établir les documents comptables obligatoires (obligation légale)." },
            {
              key: "securite",
              icon: "shield",
              content: "Assurer la sécurité du site et éviter les demandes abusives (intérêt légitime).",
            },
          ]}
        />
        <Prose>
          <p className="mt-6">Vos données ne sont jamais vendues ni utilisées pour de la publicité.</p>
        </Prose>
      </LegalSection>

      <LegalSection id="acces" num="04" title="Qui y a accès ?">
        <Prose>
          <p>
            Uniquement {info.name}, et les prestataires techniques nécessaires au fonctionnement du site : hébergement, envoi
            d&apos;emails, calcul des adresses et des itinéraires (les adresses saisies sont transmises à ce service pour
            calculer les distances). Ces prestataires n&apos;utilisent pas vos données pour leur propre compte.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="durees" num="05" title="Combien de temps ?">
        <Durations
          rows={[
            {
              key: "estimations",
              label: "Estimations non suivies d'une demande",
              text: "supprimées au bout de 30 jours.",
              figure: { value: 30, unit: "jours" },
            },
            {
              key: "photos",
              label: "Photos du véhicule",
              text: <>supprimées {PHOTO_LIMITS.retentionMonths} mois après la fin de l&apos;intervention.</>,
              figure: { value: PHOTO_LIMITS.retentionMonths, unit: "mois" },
            },
            {
              key: "demandes",
              label: "Demandes et interventions",
              text: "3 ans après le dernier contact.",
              figure: { value: 3, unit: "ans" },
            },
            {
              key: "comptables",
              label: "Documents comptables",
              text: <>10 ans, comme l&apos;exige la loi.</>,
              figure: { value: 10, unit: "ans" },
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="cookies" num="06" title="Cookies et stockage">
        <Prose>
          <p>
            Le site public n&apos;utilise aucun cookie publicitaire ni de mesure d&apos;audience. Votre navigateur garde
            temporairement votre saisie en cours de demande pour ne pas la perdre en cas de coupure ; elle s&apos;efface
            lorsque vous fermez l&apos;onglet. L&apos;espace réservé à RNB AUTO utilise un cookie de connexion indispensable.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="droits" num="07" title="Vos droits">
        <Prose>
          <p>
            Vous pouvez demander à accéder à vos données, les corriger, les supprimer, limiter leur utilisation ou vous y
            opposer, ainsi que les récupérer. Écrivez-nous : {contact}. Si vous estimez que vos droits ne sont pas respectés,
            vous pouvez saisir la CNIL (cnil.fr).
          </p>
        </Prose>
      </LegalSection>
    </LegalShell>
  );
}
