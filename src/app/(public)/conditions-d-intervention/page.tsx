import type { Metadata } from "next";
import { Prose, ToComplete } from "@/components/public/page-blocks";
import { Essentials, LegalSection, SignList } from "@/components/pages/legal/legal-objects";
import { LegalShell, type TocEntry } from "@/components/pages/legal/legal-shell";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Conditions d'intervention",
  description: "Estimation et prix confirmé, déroulement de l'intervention, suppléments, autoroute : les conditions d'intervention de RNB AUTO.",
  alternates: { canonical: "/conditions-d-intervention" },
};

const TOC: readonly TocEntry[] = [
  { id: "essentiel", label: "L'essentiel" },
  { id: "estimation", label: "Estimation et prix confirmé", num: "1" },
  { id: "compris", label: "Ce qui est compris", num: "2" },
  { id: "situation-differente", label: "Si la situation est différente", num: "3" },
  { id: "autoroutes", label: "Autoroutes et voies rapides", num: "4" },
  { id: "vehicule", label: "Le véhicule et son contenu", num: "5" },
  { id: "annulation", label: "Annulation", num: "6" },
  { id: "paiement", label: "Paiement", num: "7" },
  { id: "reclamation", label: "Réclamation et médiation", num: "8" },
];

/** Titre numéroté : le numéro est sur la borne, il reste dans le texte du titre. */
function Numbered({ n, children }: { n: string; children: string }) {
  return (
    <>
      <span className="sr-only">{n}. </span>
      {children}
    </>
  );
}

/**
 * /conditions-d-intervention « L'entrée d'agglomération » (docs/09, F.9). Textes repris mot
 * pour mot ; « L'essentiel » reprend des phrases du texte, sans en ajouter.
 */
export default async function TermsPage() {
  const info = await getPublicSiteInfo();
  return (
    <LegalShell
      eyebrow="Conditions"
      pictogram="edit"
      title="Conditions d'intervention"
      lead="Ce qu'il faut savoir avant de nous confier votre véhicule."
      toc={TOC}
    >
      <LegalSection id="essentiel" title="L'essentiel">
        <Essentials
          items={[
            {
              key: "estimation",
              icon: "ticket",
              label: "Estimation",
              text: (
                <>
                  Le calculateur en ligne affiche une <strong>estimation</strong> établie à partir des informations que vous
                  donnez.
                </>
              ),
            },
            {
              key: "prix",
              icon: "checkCircle",
              label: "Prix confirmé",
              text: (
                <>
                  Après votre demande, {info.name} vous rappelle pour <strong>confirmer le prix</strong> avant de partir.
                  L&apos;intervention n&apos;est engagée qu&apos;après votre accord sur ce prix.
                </>
              ),
            },
            {
              key: "supplement",
              icon: "info",
              label: "Supplément",
              text: (
                <>
                  Si la situation sur place ne correspond pas à la description, un supplément peut être nécessaire. Il vous
                  est toujours expliqué et annoncé <strong>avant</strong> d&apos;intervenir.
                </>
              ),
            },
            {
              key: "paiement",
              icon: "euro",
              label: "Paiement",
              text: "Les moyens de paiement acceptés et le moment du paiement vous sont indiqués lors de la confirmation du prix.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="estimation" num="1" title={<Numbered n="1">Estimation et prix confirmé</Numbered>}>
        <Prose>
          <p>
            Le calculateur en ligne affiche une <strong>estimation</strong> établie à partir des informations que vous
            donnez : lieu de prise en charge, destination, type de véhicule, situation et horaire. Elle est valable pendant
            une durée limitée, indiquée lors de la demande.
          </p>
          <p>
            Après votre demande, {info.name} vous rappelle pour <strong>confirmer le prix</strong> avant de partir.
            L&apos;intervention n&apos;est engagée qu&apos;après votre accord sur ce prix.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="compris" num="2" title={<Numbered n="2">Ce qui est compris</Numbered>}>
        <Prose>
          <p>
            Le prix comprend le déplacement de la dépanneuse, la prise en charge du véhicule et, pour un remorquage, son
            transport jusqu&apos;à la destination convenue. Les éléments pris en compte vous sont rappelés au moment de
            l&apos;estimation.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="situation-differente" num="3" title={<Numbered n="3">Si la situation est différente</Numbered>}>
        <Prose>
          <p>
            Si la situation sur place ne correspond pas à la description (véhicule bloqué, accès difficile, attente
            prolongée, véhicule plus lourd…), un supplément peut être nécessaire. Il vous est toujours expliqué et annoncé
            <strong> avant</strong> d&apos;intervenir.
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="autoroutes" num="4" title={<Numbered n="4">Autoroutes et voies rapides</Numbered>}>
        <Prose>
          <p>
            {info.name} n&apos;intervient pas directement sur les autoroutes et voies rapides où le dépannage est réservé à
            un dépanneur agréé. La prise en charge par {info.name} commence à un point situé hors de ces zones (sortie, dépôt
            du dépanneur agréé ou autre adresse).
          </p>
        </Prose>
      </LegalSection>

      <LegalSection id="vehicule" num="5" title={<Numbered n="5">Le véhicule et son contenu</Numbered>}>
        <SignList
          items={[
            {
              key: "etat",
              icon: "eye",
              content: "L'état apparent du véhicule est vérifié avec vous au moment du chargement.",
            },
            { key: "objets", icon: "lock", content: "Pensez à retirer vos objets de valeur avant le transport." },
            {
              key: "cles",
              icon: "note",
              content: "Les clés et papiers nécessaires au déplacement du véhicule doivent être remis à la dépanneuse.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="annulation" num="6" title={<Numbered n="6">Annulation</Numbered>}>
        <Prose>
          <p>Les conditions d&apos;annulation vous sont précisées lors de la confirmation du prix.</p>
        </Prose>
      </LegalSection>

      <LegalSection id="paiement" num="7" title={<Numbered n="7">Paiement</Numbered>}>
        <Prose>
          <p>Les moyens de paiement acceptés et le moment du paiement vous sont indiqués lors de la confirmation du prix.</p>
        </Prose>
      </LegalSection>

      <LegalSection id="reclamation" num="8" title={<Numbered n="8">Réclamation et médiation</Numbered>}>
        <Prose>
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
      </LegalSection>
    </LegalShell>
  );
}
