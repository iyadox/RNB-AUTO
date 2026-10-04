import type { Metadata } from "next";
import { Prose } from "@/components/public/page-blocks";
import { Chantier, LegalSection, TarePlate, type TareRow } from "@/components/pages/legal/legal-objects";
import { LegalShell, type TocEntry } from "@/components/pages/legal/legal-shell";
import { siteUrl } from "@/core/site-url";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

const TOC: readonly TocEntry[] = [
  { id: "editeur", label: "Éditeur du site", num: "01" },
  { id: "hebergement", label: "Hébergement", num: "02" },
  { id: "propriete-intellectuelle", label: "Propriété intellectuelle", num: "03" },
  { id: "donnees-personnelles", label: "Données personnelles", num: "04" },
  { id: "estimations", label: "Estimations de prix", num: "05" },
  { id: "donnees-cartographiques", label: "Données cartographiques", num: "06" },
];

function Value({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <Chantier label={label} />;
}

/** /mentions-legales « L'entrée d'agglomération » (docs/09, F.9). Textes repris mot pour mot. */
export default async function LegalPage() {
  const info = await getPublicSiteInfo();
  const { legal } = info;

  const editor: TareRow[] = [
    { key: "name", label: "Nom commercial", value: <strong>{info.name}</strong> },
    { key: "company", label: "Raison sociale", value: <Value value={legal.companyName} label="raison sociale" /> },
    { key: "form", label: "Forme juridique", value: <Value value={legal.legalForm} label="forme juridique" /> },
    { key: "address", label: "Siège", value: <Value value={legal.address} label="adresse du siège" /> },
    { key: "siret", label: "SIRET", value: <Value value={legal.siret} label="SIRET" /> },
    ...(legal.vatNumber ? [{ key: "vat", label: "TVA intracommunautaire", value: legal.vatNumber }] : []),
    {
      key: "phone",
      label: "Téléphone",
      value: info.phone ? <a href={info.phone.href}>{info.phone.display}</a> : <Chantier label="téléphone" />,
    },
    {
      key: "email",
      label: "Email",
      value: info.email ? <a href={`mailto:${info.email}`}>{info.email}</a> : <Chantier label="email" />,
    },
    {
      key: "director",
      label: "Directeur ou directrice de la publication",
      value: <Value value={legal.publicationDirector} label="directeur de la publication" />,
    },
    ...(legal.insurance ? [{ key: "insurance", label: "Assurance professionnelle", value: legal.insurance }] : []),
  ];

  return (
    <LegalShell eyebrow="Informations légales" pictogram="note" title="Mentions légales" toc={TOC}>
      <LegalSection id="editeur" num="01" title="Éditeur du site">
        <TarePlate rows={editor} />
      </LegalSection>

      <LegalSection id="hebergement" num="02" title="Hébergement">
        <Prose>
          <p>
            {legal.host ? (
              <span className="whitespace-pre-line">{legal.host}</span>
            ) : (
              <Chantier label="nom, adresse et téléphone de l'hébergeur" />
            )}
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="propriete-intellectuelle" num="03" title="Propriété intellectuelle">
        <Prose>
          <p>
            Les textes, illustrations, logos et éléments graphiques du site {siteUrl().replace(/^https?:\/\//, "")} sont la
            propriété de {info.name}, sauf mention contraire. Toute reproduction sans autorisation est interdite.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="donnees-personnelles" num="04" title="Données personnelles">
        <Prose>
          <p>
            Le traitement des informations transmises par le formulaire de demande est décrit dans notre{" "}
            <a href="/confidentialite">politique de confidentialité</a>.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="estimations" num="05" title="Estimations de prix">
        <Prose>
          <p>
            Les prix affichés par le calculateur en ligne sont des estimations établies à partir des informations fournies.
            Le prix de l&apos;intervention est confirmé avant celle-ci. Voir nos{" "}
            <a href="/conditions-d-intervention">conditions d&apos;intervention</a>.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="donnees-cartographiques" num="06" title="Données cartographiques">
        <Prose>
          <p>
            Les adresses et distances sont calculées à l&apos;aide de services cartographiques publics (notamment la
            Géoplateforme de l&apos;IGN et les données OpenStreetMap).
          </p>
        </Prose>
      </LegalSection>
    </LegalShell>
  );
}
