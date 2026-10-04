import { describe, expect, it } from "vitest";
import { FAQ, FAQ_THEMES, HOME_FAQ_IDS, faqItems } from "./faq";

/**
 * Textes d'origine, copiés mot pour mot de l'existant au commit 77c92ed
 * (`HOME_FAQ` de src/components/home/sections.tsx, puis `MORE_FAQ` de
 * src/app/(public)/questions-frequentes/page.tsx). Ils ne doivent jamais dériver.
 */
const ORIGINAL: { q: string; a: string }[] = [
  {
    q: "Le prix affiché en ligne est-il définitif ?",
    a: "C'est une estimation calculée avec nos tarifs, votre position, la destination, votre véhicule et l'horaire. Nous la confirmons avec vous par téléphone avant d'intervenir. Si la situation sur place est différente de ce qui a été décrit, nous vous en parlons avant tout supplément.",
  },
  {
    q: "Pouvez-vous venir sur l'autoroute ?",
    a: "Non : sur l'autoroute et les voies rapides, seul le dépanneur agréé du secteur peut intervenir. Il sort votre véhicule de la voie, puis nous pouvons prendre le relais pour l'emmener où vous voulez.",
  },
  {
    q: "Où pouvez-vous emmener mon véhicule ?",
    a: "Au garage de votre choix, chez vous ou à toute autre adresse. Indiquez-la dans la demande : le prix en tient compte.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le prix est confirmé avec vous avant l'intervention. Les moyens de paiement acceptés vous sont indiqués à ce moment-là.",
  },
  {
    q: "Comment est calculé le prix ?",
    a: "Le prix tient compte du trajet réel de la dépanneuse calculé sur les routes, du type de véhicule, de la situation (non roulant, parking…) et de l'horaire (nuit, dimanche, jour férié). Vous voyez l'estimation avant d'envoyer votre demande.",
  },
  {
    q: "Dois-je être présent au moment de l'intervention ?",
    a: "C'est préférable, notamment pour remettre les clés et vérifier ensemble l'état du véhicule. Si ce n'est pas possible, dites-le nous à la demande : nous trouverons une solution ensemble.",
  },
  {
    q: "Pourquoi le site demande-t-il ma position ?",
    a: "Uniquement pour calculer la distance et savoir où envoyer la dépanneuse. La position n'est demandée que si vous appuyez sur « Utiliser ma position ». Vous pouvez aussi saisir l'adresse vous-même.",
  },
  {
    q: "Quels véhicules pouvez-vous transporter ?",
    a: "Citadines, berlines, breaks, SUV, 4x4, utilitaires et petits fourgons. Pour les plus grands véhicules, nous vérifions avec vous que le transport est possible avant de vous donner un prix.",
  },
  {
    q: "Puis-je envoyer des photos ?",
    a: "Oui : juste après votre demande, vous pouvez ajouter des photos depuis votre téléphone, ou nous les envoyer sur WhatsApp. Elles nous aident à venir avec le bon matériel et restent privées.",
  },
  {
    q: "Le prix peut-il changer sur place ?",
    a: "Seulement si la situation est différente de ce qui a été décrit (véhicule bloqué, accès compliqué…). Dans ce cas, nous vous expliquons pourquoi et vous annonçons le nouveau prix avant d'intervenir.",
  },
  {
    q: "Que faire si je ne peux pas utiliser le site ?",
    a: "Appelez-nous ou écrivez-nous sur WhatsApp : les boutons sont toujours visibles en bas de l'écran de votre téléphone.",
  },
];

describe("questions fréquentes", () => {
  it("reprend les 11 questions existantes, mot pour mot et dans l'ordre", () => {
    expect(FAQ.map(({ q, a }) => ({ q, a }))).toEqual(ORIGINAL);
  });

  it("a des identifiants uniques, utilisables comme ancres", () => {
    const ids = FAQ.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("garde l'ancre « prix-definitif » citée par le cahier", () => {
    expect(faqItems(["prix-definitif"])[0]?.q).toBe("Le prix affiché en ligne est-il définitif ?");
  });

  it("range chaque question dans un thème connu, et chaque thème sert", () => {
    const themes = new Set(FAQ_THEMES.map((theme) => theme.id));
    for (const item of FAQ) expect(themes.has(item.theme)).toBe(true);
    for (const theme of themes) expect(FAQ.some((item) => item.theme === theme)).toBe(true);
  });

  it("garde l'aperçu de l'accueil (les quatre questions d'origine)", () => {
    expect(faqItems(HOME_FAQ_IDS).map((item) => item.q)).toEqual(ORIGINAL.slice(0, 4).map((item) => item.q));
  });

  it("refuse un identifiant inconnu", () => {
    expect(() => faqItems(["inconnue"])).toThrow();
  });
});
