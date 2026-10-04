import type { Metadata } from "next";
import { PageHero, Prose, Section, ToComplete } from "@/components/public/page-blocks";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Conditions d'intervention",
  description: "Estimation et prix confirmé, déroulement de l'intervention, suppléments, autoroute : les conditions d'intervention de RNB AUTO.",
  alternates: { canonical: "/conditions-d-intervention" },
};

export default async function TermsPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <PageHero
        eyebrow="Conditions"
        title="Conditions d'intervention"
        lead="Ce qu'il faut savoir avant de nous confier votre véhicule."
      />
      <Section tone="darker">
        <Prose>
          <h2>1. Estimation et prix confirmé</h2>
          <p>
            Le calculateur en ligne affiche une <strong>estimation</strong> établie à partir des informations que vous
            donnez : lieu de prise en charge, destination, type de véhicule, situation et horaire. Elle est valable pendant
            une durée limitée, indiquée lors de la demande.
          </p>
          <p>
            Après votre demande, {info.name} vous rappelle pour <strong>confirmer le prix</strong> avant de partir.
            L&apos;intervention n&apos;est engagée qu&apos;après votre accord sur ce prix.
          </p>

          <h2>2. Ce qui est compris</h2>
          <p>
            Le prix comprend le déplacement de la dépanneuse, la prise en charge du véhicule et, pour un remorquage, son
            transport jusqu&apos;à la destination convenue. Les éléments pris en compte vous sont rappelés au moment de
            l&apos;estimation.
          </p>

          <h2>3. Si la situation est différente</h2>
          <p>
            Si la situation sur place ne correspond pas à la description (véhicule bloqué, accès difficile, attente
            prolongée, véhicule plus lourd…), un supplément peut être nécessaire. Il vous est toujours expliqué et annoncé
            <strong> avant</strong> d&apos;intervenir.
          </p>

          <h2>4. Autoroutes et voies rapides</h2>
          <p>
            {info.name} n&apos;intervient pas directement sur les autoroutes et voies rapides où le dépannage est réservé à
            un dépanneur agréé. La prise en charge par {info.name} commence à un point situé hors de ces zones (sortie, dépôt
            du dépanneur agréé ou autre adresse).
          </p>

          <h2>5. Le véhicule et son contenu</h2>
          <ul>
            <li>L&apos;état apparent du véhicule est vérifié avec vous au moment du chargement.</li>
            <li>Pensez à retirer vos objets de valeur avant le transport.</li>
            <li>Les clés et papiers nécessaires au déplacement du véhicule doivent être remis à la dépanneuse.</li>
          </ul>

          <h2>6. Annulation</h2>
          <p>Les conditions d&apos;annulation vous sont précisées lors de la confirmation du prix.</p>

          <h2>7. Paiement</h2>
          <p>Les moyens de paiement acceptés et le moment du paiement vous sont indiqués lors de la confirmation du prix.</p>

          <h2>8. Réclamation et médiation</h2>
          <p>
            Pour toute réclamation, contactez d&apos;abord {info.name}
            {info.email ? (
              <>
                {" "}
                à <a href={`mailto:${info.email}`}>{info.email}</a>
              </>
            ) : null}
            . En cas de désaccord persistant, vous pouvez recourir gratuitement au médiateur de la consommation :{" "}
            <ToComplete label="nom et coordonnées du médiateur" />.
          </p>
        </Prose>
      </Section>
    </>
  );
}
