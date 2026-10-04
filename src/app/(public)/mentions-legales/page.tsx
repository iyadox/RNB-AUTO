import type { Metadata } from "next";
import { PageHero, Prose, Section, ToComplete } from "@/components/public/page-blocks";
import { siteUrl } from "@/core/site-url";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

function Value({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <ToComplete label={label} />;
}

export default async function LegalPage() {
  const info = await getPublicSiteInfo();
  const { legal } = info;
  return (
    <>
      <PageHero eyebrow="Informations légales" title="Mentions légales" />
      <Section tone="darker">
        <Prose>
          <h2>Éditeur du site</h2>
          <ul>
            <li>
              Nom commercial : <strong>{info.name}</strong>
            </li>
            <li>
              Raison sociale : <Value value={legal.companyName} label="raison sociale" />
            </li>
            <li>
              Forme juridique : <Value value={legal.legalForm} label="forme juridique" />
            </li>
            <li>
              Siège : <Value value={legal.address} label="adresse du siège" />
            </li>
            <li>
              SIRET : <Value value={legal.siret} label="SIRET" />
            </li>
            {legal.vatNumber ? <li>TVA intracommunautaire : {legal.vatNumber}</li> : null}
            <li>
              Téléphone : {info.phone ? <a href={info.phone.href}>{info.phone.display}</a> : <ToComplete label="téléphone" />}
            </li>
            <li>
              Email : {info.email ? <a href={`mailto:${info.email}`}>{info.email}</a> : <ToComplete label="email" />}
            </li>
            <li>
              Directeur ou directrice de la publication :{" "}
              <Value value={legal.publicationDirector} label="directeur de la publication" />
            </li>
            {legal.insurance ? <li>Assurance professionnelle : {legal.insurance}</li> : null}
          </ul>

          <h2>Hébergement</h2>
          <p>{legal.host ? <span className="whitespace-pre-line">{legal.host}</span> : <ToComplete label="nom, adresse et téléphone de l'hébergeur" />}</p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Les textes, illustrations, logos et éléments graphiques du site {siteUrl().replace(/^https?:\/\//, "")} sont la
            propriété de {info.name}, sauf mention contraire. Toute reproduction sans autorisation est interdite.
          </p>

          <h2>Données personnelles</h2>
          <p>
            Le traitement des informations transmises par le formulaire de demande est décrit dans notre{" "}
            <a href="/confidentialite">politique de confidentialité</a>.
          </p>

          <h2>Estimations de prix</h2>
          <p>
            Les prix affichés par le calculateur en ligne sont des estimations établies à partir des informations fournies.
            Le prix de l&apos;intervention est confirmé avant celle-ci. Voir nos{" "}
            <a href="/conditions-d-intervention">conditions d&apos;intervention</a>.
          </p>

          <h2>Données cartographiques</h2>
          <p>
            Les adresses et distances sont calculées à l&apos;aide de services cartographiques publics (notamment la
            Géoplateforme de l&apos;IGN et les données OpenStreetMap).
          </p>
        </Prose>
      </Section>
    </>
  );
}
