/** Données structurées (schema.org) pour les moteurs de recherche. Aucune information inventée. */
import { siteUrl } from "@/core/site-url";
import type { PublicSiteInfo } from "@/server/site/public-info";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Le contenu est sérialisé par JSON.stringify ; « < » est échappé pour éviter toute injection.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function localBusinessJsonLd(info: PublicSiteInfo): Record<string, unknown> {
  const [street, rest] = info.depotLabel.split(",").map((part) => part.trim());
  const postcode = rest?.match(/\d{5}/)?.[0];
  const city = rest?.replace(/\d{5}/, "").trim();
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "@id": `${url}/#entreprise`,
    name: info.name,
    description: "Dépannage, remorquage et assistance automobile à Bobigny et en Île-de-France.",
    url,
    image: `${url}/opengraph-image`,
    ...(info.phone ? { telephone: info.phone.e164 } : {}),
    ...(info.email ? { email: info.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      ...(postcode ? { postalCode: postcode } : {}),
      ...(city ? { addressLocality: city } : {}),
      addressRegion: "Île-de-France",
      addressCountry: "FR",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Seine-Saint-Denis" },
      { "@type": "City", name: "Paris" },
      { "@type": "AdministrativeArea", name: "Île-de-France" },
    ],
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Remorquage de véhicule" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dépannage automobile sur place" } },
    ],
  };
}
