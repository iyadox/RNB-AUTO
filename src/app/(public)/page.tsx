/**
 * Accueil (docs/09, E) : une nuit sur la route, de minuit à l'aube.
 * Ouverture · portique · carrefour (PK 01) · comment ça marche (PK 02) · prix (PK 03) ·
 * autoroute (PK 04) · zone (PK 05) · questions (PK 06) · « On arrive. » (PK 07), puis le pied de
 * page « Retour au dépôt ». La ligne de route (`RoadLine`) reste hors de la transition de page.
 *
 * Hydratation sélective (`HydrateLater`, temps de blocage) : l'ouverture est hydratée avec la
 * page ; le portique et l'autoroute (sans titre découpé) le sont ensuite, par tranches. Les autres
 * sections gardent leur titre `[data-split]` dans le passage principal et diffèrent le reste
 * elles-mêmes.
 *
 * Du carrefour aux questions, les sections sont posées sur la piste du décor « de la commande à
 * l'arrivée » (`StoryTrack`, voir src/components/story). Trois fenêtres (`StoryWindow`) laissent
 * le décor jouer seul : la demande sur le téléphone, l'arrivée de la dépanneuse de nuit, le
 * chargement et le départ ; l'aube se lève ensuite et passe la main à « On arrive. ».
 */
import type { Metadata } from "next";
import { Crossroads } from "@/components/home/crossroads";
import { FaqPreview } from "@/components/home/faq-preview";
import { Gantry } from "@/components/home/gantry";
import { Hero } from "@/components/home/hero";
import { HighwaySection } from "@/components/home/highway-section";
import { HomeScenes } from "@/components/home/home-scenes";
import { PriceSection } from "@/components/home/price-section";
import { Story } from "@/components/home/story";
import { ZoneSection } from "@/components/home/zone-section";
import { PageTransition } from "@/components/motion/page-transition";
import { JsonLd, localBusinessJsonLd } from "@/components/public/json-ld";
import { DawnCta } from "@/components/public/page-blocks";
import { RoadLine, type RoadMarker } from "@/components/public/road-line";
import { StoryTrack } from "@/components/story/story-track";
import { StoryWindow } from "@/components/story/story-window";
import { HydrateLater } from "@/components/ui/hydrate-later";
import { getHomePriceExamples } from "@/server/site/price-examples";
import { getPublicSiteInfo } from "@/server/site/public-info";

/** Titre et description : ceux du layout. Seule l'URL canonique est ajoutée (paramètres retirés). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const MARKERS: RoadMarker[] = [
  { id: "carrefour", pk: "01", label: "Votre situation" },
  { id: "comment-ca-marche", pk: "02", label: "Comment ça marche" },
  { id: "prix", pk: "03", label: "Le prix" },
  { id: "autoroute", pk: "04", label: "Sur l'autoroute" },
  { id: "zone", pk: "05", label: "Notre zone" },
  { id: "questions", pk: "06", label: "Vos questions" },
  { id: "on-arrive", pk: "07", label: "On arrive" },
];

export default async function HomePage() {
  const [info, examples] = await Promise.all([getPublicSiteInfo(), getHomePriceExamples()]);
  return (
    <>
      <JsonLd data={localBusinessJsonLd(info)} />
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <Hero info={info} />
        <HydrateLater>
          <Gantry info={info} />
        </HydrateLater>
        {/* Fil conducteur « de la commande à l'arrivée » : décor collant derrière ces sections. */}
        <StoryTrack>
          <Crossroads info={info} />
          <StoryWindow act={1} />
          <Story info={info} />
          <StoryWindow act={2} />
          <PriceSection info={info} examples={examples} />
          <HydrateLater>
            <HighwaySection />
          </HydrateLater>
          <StoryWindow act={3} />
          <ZoneSection info={info} />
          <FaqPreview />
        </StoryTrack>
        <div id="on-arrive">
          <DawnCta
            info={info}
            title="On arrive."
            text="Décrivez votre situation en moins d'une minute. Nous vous rappelons pour confirmer et la dépanneuse part."
            truck="loaded"
            ground="ON ARRIVE"
          />
        </div>
      </PageTransition>
      <HomeScenes />
    </>
  );
}
