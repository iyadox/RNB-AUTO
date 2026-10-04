/**
 * Questions fréquentes : source unique du site (docs/09, D.10-4).
 * Elle sert à l'accueil, à la page des questions, aux « questions liées » des sous-pages et aux
 * données structurées FAQPage. Les 11 textes sont repris mot pour mot de l'existant :
 * aucune question inventée. L'identifiant sert d'ancre (`/questions-frequentes#prix-definitif`).
 */

export type FaqTheme = "prix" | "intervention" | "autoroute" | "vehicules" | "photos-position";

export type FaqItem = {
  /** Identifiant stable, utilisé comme ancre d'URL. */
  id: string;
  q: string;
  a: string;
  theme: FaqTheme;
  /** Présente dans l'aperçu de l'accueil. */
  home?: true;
};

export const FAQ: readonly FaqItem[] = [
  {
    id: "prix-definitif",
    theme: "prix",
    home: true,
    q: "Le prix affiché en ligne est-il définitif ?",
    a: "C'est une estimation calculée avec nos tarifs, votre position, la destination, votre véhicule et l'horaire. Nous la confirmons avec vous par téléphone avant d'intervenir. Si la situation sur place est différente de ce qui a été décrit, nous vous en parlons avant tout supplément.",
  },
  {
    id: "autoroute",
    theme: "autoroute",
    home: true,
    q: "Pouvez-vous venir sur l'autoroute ?",
    a: "Non : sur l'autoroute et les voies rapides, seul le dépanneur agréé du secteur peut intervenir. Il sort votre véhicule de la voie, puis nous pouvons prendre le relais pour l'emmener où vous voulez.",
  },
  {
    id: "destination",
    theme: "intervention",
    home: true,
    q: "Où pouvez-vous emmener mon véhicule ?",
    a: "Au garage de votre choix, chez vous ou à toute autre adresse. Indiquez-la dans la demande : le prix en tient compte.",
  },
  {
    id: "paiement",
    theme: "prix",
    home: true,
    q: "Comment se passe le paiement ?",
    a: "Le prix est confirmé avec vous avant l'intervention. Les moyens de paiement acceptés vous sont indiqués à ce moment-là.",
  },
  {
    id: "calcul-du-prix",
    theme: "prix",
    q: "Comment est calculé le prix ?",
    a: "Le prix tient compte du trajet réel de la dépanneuse calculé sur les routes, du type de véhicule, de la situation (non roulant, parking…) et de l'horaire (nuit, dimanche, jour férié). Vous voyez l'estimation avant d'envoyer votre demande.",
  },
  {
    id: "presence",
    theme: "intervention",
    q: "Dois-je être présent au moment de l'intervention ?",
    a: "C'est préférable, notamment pour remettre les clés et vérifier ensemble l'état du véhicule. Si ce n'est pas possible, dites-le nous à la demande : nous trouverons une solution ensemble.",
  },
  {
    id: "position",
    theme: "photos-position",
    q: "Pourquoi le site demande-t-il ma position ?",
    a: "Uniquement pour calculer la distance et savoir où envoyer la dépanneuse. La position n'est demandée que si vous appuyez sur « Utiliser ma position ». Vous pouvez aussi saisir l'adresse vous-même.",
  },
  {
    id: "vehicules",
    theme: "vehicules",
    q: "Quels véhicules pouvez-vous transporter ?",
    a: "Citadines, berlines, breaks, SUV, 4x4, utilitaires et petits fourgons. Pour les plus grands véhicules, nous vérifions avec vous que le transport est possible avant de vous donner un prix.",
  },
  {
    id: "photos",
    theme: "photos-position",
    q: "Puis-je envoyer des photos ?",
    a: "Oui : juste après votre demande, vous pouvez ajouter des photos depuis votre téléphone, ou nous les envoyer sur WhatsApp. Elles nous aident à venir avec le bon matériel et restent privées.",
  },
  {
    id: "prix-sur-place",
    theme: "prix",
    q: "Le prix peut-il changer sur place ?",
    a: "Seulement si la situation est différente de ce qui a été décrit (véhicule bloqué, accès compliqué…). Dans ce cas, nous vous expliquons pourquoi et vous annonçons le nouveau prix avant d'intervenir.",
  },
  {
    id: "sans-le-site",
    theme: "intervention",
    q: "Que faire si je ne peux pas utiliser le site ?",
    a: "Appelez-nous ou écrivez-nous sur WhatsApp : les boutons sont toujours visibles en bas de l'écran de votre téléphone.",
  },
];

/** Thèmes, dans l'ordre d'affichage de la page des questions. */
export const FAQ_THEMES: readonly { id: FaqTheme; label: string }[] = [
  { id: "prix", label: "Prix et paiement" },
  { id: "intervention", label: "L'intervention" },
  { id: "autoroute", label: "Autoroute" },
  { id: "vehicules", label: "Véhicules" },
  { id: "photos-position", label: "Photos et position" },
];

/** Questions de l'aperçu de l'accueil, dans l'ordre. */
export const HOME_FAQ_IDS: readonly string[] = FAQ.filter((item) => item.home).map((item) => item.id);

/** Questions choisies par identifiant, dans l'ordre demandé. Un identifiant inconnu est une erreur. */
export function faqItems(ids: readonly string[]): FaqItem[] {
  return ids.map((id) => {
    const item = FAQ.find((candidate) => candidate.id === id);
    if (!item) throw new Error(`Question inconnue : ${id}`);
    return item;
  });
}
