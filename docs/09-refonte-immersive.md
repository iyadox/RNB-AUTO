# PLEINS PHARES : cahier de conception final de la refonte immersive du site public RNB AUTO

> Version 1, 4 octobre 2026. Ce cahier couvre les pages publiques de `src/app/(public)`. L'espace `/admin` n'est pas concerné.
>
> **Sources :**
> - les directions « cinema » (PLAN-SÉQUENCE), « signal » (BALISAGE) et « product » (LIGNE JAUNE) ;
> - l'avis des juges « immersion », « urgence » et « faisabilité » ;
> - la lecture du code au commit `77c92ed`.
>
> **Statut :** c'est la référence unique des agents. Le lot S1 l'enregistre tel quel dans `docs/09-refonte-immersive.md`. Toute décision qui s'en écarte y est ajoutée, avec sa raison.
>
> **Conventions de mesure :** toutes les tailles sont données pour un téléphone de 390 px de large et un ordinateur de 1 440 px. Les poids de JavaScript ont été mesurés dans `node_modules` (`gzip -9`).

## Décisions clés

1. **La base est BALISAGE.** Elle a le meilleur score cumulé des juges (22,5 sur 30) et fournit la grammaire de signalisation et la sobriété. On l'habille avec l'atmosphère de PLAN-SÉQUENCE (ciel continu, lumière codée, aube) et on lui ajoute les garde-fous vérifiables de LIGNE JAUNE.
2. **Chaque page est une nuit, de minuit à l'aube.** L'heure change section par section, jamais en suivant le défilement brut.
3. **Plus aucune carte générique.** Les grands liens sont des panneaux, les listes sont des objets de la route : voyants, bornes, ticket, plaques.
4. **Le titre principal, l'accroche et les boutons sont visibles et immobiles dès la première image.** Seule une lumière passe sur un texte déjà lisible.
5. **Aucun épinglage GSAP.** Les scènes collantes utilisent `position: sticky`, sur ordinateur seulement. Sur mobile, rien n'est collant.
6. **JavaScript d'animation réduit au minimum :** GSAP, ScrollTrigger et SplitText, soit 48,6 Ko compressés. Ils sont chargés après l'affichage et seulement sur les pages qui en ont besoin. Lenis reste sur ordinateur. Aucun autre module GSAP.
7. **Transition de page « allumage des phares ».** Ni l'en-tête ni la barre d'action ne participent à la transition : le reste du site reste vivant et cliquable.
8. **Le carrefour « Où en êtes-vous ? » occupe le deuxième écran de l'accueil.**
9. **Un seul ticket d'estimation sur tout le site.** Sur l'accueil, il montre un exemple calculé par le moteur. Sur /demande, il montre le vrai prix renvoyé par le serveur.
10. **La logique de /demande est intacte.** Seuls l'habillage et les micro-interactions changent.
11. **Longueur de l'accueil :** environ 12 écrans sur mobile, environ 13 sur ordinateur.
12. **Ordre de construction :** socle S1, puis S2a et S2b en parallèle, puis 8 lots en parallèle, puis la recette L9.

---

## A. Concept retenu

### A.1 Nom, pitch, fil conducteur

**PLEINS PHARES**

> Une seule nuit sur la route, de la panne jusqu'au lever du jour au dépôt. Chaque page commence à minuit et finit à l'aube. La route est balisée comme une vraie route de nuit : les panneaux sont des liens, le panneau lumineux donne les faits, les phares de la dépanneuse éclairent ce qu'il faut lire.
> Et dans chaque image, Appeler, WhatsApp et Demande restent sous le pouce.

**Trois fils conducteurs** traversent tout le site.

1. **La ligne de route.** La ligne médiane de la route de l'ouverture ne s'arrête jamais :
   - elle devient la bande de progression (à gauche sur ordinateur, sous l'en-tête sur mobile) ;
   - elle se divise en quatre au carrefour ;
   - elle devient les trois trajets de la dépanneuse : aller, transport (en jaune, c'est votre véhicule), retour ;
   - elle devient les six bornes de la demande ;
   - elle finit au dépôt, dans le pied de page.
2. **L'heure.** On passe de minuit en haut de page à la nuit, puis à l'heure bleue, puis à l'aube en bas. L'heure est vécue, jamais affichée : aucune promesse horaire, aucun « 24 h/24 » inventé.
3. **La lumière.** Chaque lueur a une source visible : lampadaire, phare, gyrophare, feux de détresse ou LED. Ce qui est éclairé, c'est ce qu'il faut lire.

### A.2 Pourquoi c'est immersif et utile pour quelqu'un en panne

- **Le récit est celui du visiteur :** panne, orientation, prix, arrivée, destination, retour. Chaque scène illustre un fait vrai : le dépôt, les trois trajets, le prix avant le départ, le relais après l'autoroute.
- **La signalisation se lit de nuit, de loin, en une seconde.** Contraste maximal, flèches, un seul message à la fois : le test des 3 secondes est intégré au langage visuel.
- **La nuit est une interface sombre sans aplat blanc.** Elle reste confortable à 2 h du matin et lisible en plein soleil grâce au jaune.
- **Les mêmes objets veulent dire la même chose partout, y compris dans la demande.**

  | Objet | Signification |
  |---|---|
  | Voyants | le problème |
  | Silhouettes | le véhicule |
  | Trois trajets | le calcul |
  | Ticket | le prix |
  | Gyrophare | RNB AUTO en intervention |
  | Bleu | l'autoroute, donc jamais RNB AUTO |

- **L'immersion reste à l'arrière-plan, l'action au premier plan.** Aucune animation ne précède un bouton.

### A.3 Ce que la fusion prend à chaque direction

| Direction | Idées retenues |
|---|---|
| PLAN-SÉQUENCE | Ciel continu de minuit à l'aube (piloté par les sections).<br>Lumière codée et reflets sur la route mouillée.<br>Freinage de l'ouverture (les warnings du client répondent au gyrophare).<br>Plan grue (la route se couche et devient la carte).<br>Ticket qui s'imprime, avec tampon « EXEMPLE ».<br>Aube, puis « Retour au dépôt ».<br>Voyants qui s'allument comme à la mise du contact.<br>Plan technique de la dépanneuse sur /entreprise.<br>Route en « ? » sur /questions-frequentes.<br>Route barrée sur la 404.<br>Menu avec une ligne d'aide par lien.<br>Niveau d'animation `lite` automatique.<br>Test `elementFromPoint` sur la barre d'action. |
| BALISAGE | Panneaux qui sont des liens.<br>Carrefour « Où en êtes-vous ? ».<br>Panneau à messages strictement factuel.<br>Reflet rétroréfléchissant au milieu de l'écran (CSS seul).<br>« ON ARRIVE » peint sur la chaussée.<br>Panneau du carrefour qui devient l'en-tête de la page (morph).<br>Repères PK.<br>Villes de l'horizon en fichiers SVG statiques.<br>Grain statique.<br>`getPointAtLength` à la place de MotionPath.<br>Une mini-carte par étape sur mobile.<br>Page autoroute sobre, avec lien `tel:112`.<br>Bloc `<noscript>` et focus sur le titre d'étape dans la demande.<br>Liste des textes protégés par les tests.<br>Panneau d'entrée d'agglomération pour les pages légales. |
| LIGNE JAUNE | Titre principal visible dès la première image.<br>Script d'en-tête qui fixe le niveau d'animation avant l'affichage.<br>Modules de scène `init`/`cleanup` chargés à la demande.<br>Règles de transition de page (jamais d'élément cliquable nommé, enveloppe dans chaque page).<br>Révélation circulaire depuis le point touché.<br>Une carte schématique unique, le « Plan RNB ».<br>Exemple jour/nuit, réduit à une seule commande.<br>Libellés du ticket fournis par le moteur.<br>Point vert seulement si la disponibilité est réglée.<br>Barre d'action à deux boutons sur /demande, en CSS `:has`.<br>Message au bout de 4 s d'attente.<br>Récapitulatif des choix en « feuille de route ».<br>Épinglage coupé sur les petits écrans. |

### A.4 Ce qui est écarté, et pourquoi

| Idée | Origine | Raison |
|---|---|---|
| Grain de pellicule animé au-dessus du contenu, vignette, ardoises « 03 / 07 » en ScrambleText | cinema | Pastiche de cinéma, moins lisible en plein soleil, coût en batterie. Remplacés par un grain statique **sous** le contenu et des plaques PK. |
| Titres qui s'étirent avec la vitesse de défilement (SpeedStretch) | cinema | Gadget, recalcul du texte à chaque image. |
| Lampe torche, phares mis à jour panneau par panneau | cinema, signal | Doublons. On garde un seul halo très doux sur ordinateur, sans mise à jour par panneau. |
| Ville en canvas (milliers de points) | cinema | Esthétique générique et coûteuse. Remplacée par le Plan RNB en SVG, balayé par le gyrophare. |
| Essuie-glace, tunnel de lumière | cinema | Masque plein écran repeint à chaque image, défilement sans contenu. |
| Ciel piloté par le défilement de toute la page | cinema | Repeinte plein écran à chaque image, aube trop rapide sur les pages courtes. Remplacé par des états par section avec transition ponctuelle. |
| Titre principal « dans l'ombre » à 3:1 avant d'être éclairé | cinema | Le message principal doit être lisible en entier dès la première image. |
| Barre d'action qui se rétracte quand le clavier est ouvert | cinema | Appeler disparaîtrait au pire moment. |
| Tout épinglage GSAP (ouverture, piste horizontale, portique, relais, « On arrive », plateau) | toutes | Défilement détourné, problèmes iOS et clavier. Les options de tri doivent se lire d'un coup d'œil. |
| MorphSVG (9,3 Ko), Flip (9,4), MotionPath (9,4), DrawSVG (2,1), ScrambleText (3,8), CustomEase (3,5), Observer, ScrollSmoother, WebGL | toutes | `pathLength`, `getPointAtLength`, `linear()` en CSS et un fondu font le même travail gratuitement. ScrollSmoother casse `position: fixed`. |
| Couleurs de panneaux en plus (vert direction, rouge cartouche, panneaux blancs pleine largeur), cartouches « D 03 », menu et pied de page en panneaux | signal | Palette fragmentée, monotonie, ambiguïté. |
| Fond réduit à trois halos | signal | Trop pauvre. Remplacé par le ciel continu. |
| Gyrophare qui pulse autour d'Appeler dans la barre fixe | signal | La barre d'urgence doit rester parfaitement calme. |
| Largeur de police animée sur des titres de plusieurs lignes, titre principal qui se resserre | signal, product | Les retours à la ligne changent et le bouton bouge (décalage de mise en page). |
| Même nom de transition sur deux panneaux, barre d'action nommée | signal, cinema | Le navigateur abandonne la transition, et Appeler n'est plus cliquable pendant la transition. |
| Métaphore du transport en commun (« Station suivante », « Terminus », plan de ligne, voies de péage) | product | Contredit l'univers de la route de nuit. |
| Accueil de 1 300 à 1 500 vh avec liens « Passer » | product | Trop long : une immersion qu'on propose de sauter n'en est plus une. |
| Appel entrant qui vibre, plaques émaillées arrondies, plan à plat omniprésent, « Prix » dans la navigation, en-tête mobile masqué, simulateur à 4 commandes, carrousel des situations, vol des choix en ViewTransition | product | Maquette de téléphone ou cartes déguisées, infographie, lien vers un exemple au lieu du vrai prix, incohérence, attente de prix trompeuse, options cachées, `startTransition` à ajouter dans les 1 235 lignes du parcours. |
| Carte ou ticket collants sur mobile | cinema, product | Reproduit le chevauchement visible aujourd'hui. |
| Photos factices, emplacement photo vide | signal | Aucune photo fournie (docs/07 A) : rien n'est affiché tant qu'il n'y en a pas. |

### A.5 Défauts de l'existant corrigés (constatés dans le code)

| Constat | Où | Correction |
|---|---|---|
| Le bouton « Demander un dépannage » reste invisible 600 ms, puis apparaît en fondu. L'accroche attend 450 ms, la liste 750 ms. | `src/components/home/hero.tsx` l. 58, 65, 95 | Aucun délai ni fondu sur le titre principal, l'accroche et les boutons. |
| Titre principal caché dans des masques au chargement (`RiseWords`) | `hero.tsx` l. 8-22 et 49-56 | Titre statique. Un faisceau passe sur un texte déjà visible. |
| En-tête des sous-pages en fondus décalés (120, 240 et 360 ms) | `src/components/public/page-blocks.tsx` l. 28-44 | Le bloc d'ouverture n'a aucune animation d'entrée sur le texte ni sur les boutons. |
| Point vert pulsé affiché même quand la disponibilité est vide | `hero.tsx` l. 36-40 | Point vert seulement si `info.availability` est rempli. |
| Centre de la carte écrit en dur (`ORIGIN`) | `src/components/home/sections.tsx` l. 406 | Lu dans le réglage `company.depot`, via `info.depot`. |
| Carte collante de 46svh qui recouvre les étapes sur mobile | `sections.tsx` l. 146 | Rien de collant sur mobile : une mini-carte par étape. |
| Section prix sur fond craie (éblouissante de nuit) | `sections.tsx` l. 266 | Supprimée. Le seul objet clair est le ticket. |
| La barre d'action propose « Demande » sur /demande | `src/components/public/action-bar.tsx` l. 50-56 | Masqué sur /demande (CSS `:has`). |
| Téléphone et bouton de l'en-tête coupés sur deux lignes à 1 440 px | `src/components/public/site-header.tsx` l. 70-85 (capture `home-d-00`) | `whitespace-nowrap`. Entre 1 024 et 1 279 px, le texte devient « Appeler ». |
| « L'entreprise » absente du menu | `site-header.tsx` l. 11-18 | Ajoutée au menu mobile. |
| Grain `feTurbulence` recalculé à chaque peinture | `src/app/globals.css` l. 272-274 | Tuile PNG statique. |
| Ville dessinée avec des centaines de `<rect>`, en double dans le HTML | `src/components/home/night-road.tsx` l. 17-48 | Deux fichiers SVG statiques, mis en cache. |
| Halos animés en `blur-3xl` | `hero.tsx` l. 31, `page-blocks.tsx` l. 26 | Dégradés radiaux, sans filtre. |
| FAQ répartie entre deux sources | `sections.tsx` l. 514 et `questions-frequentes/page.tsx` l. 14 | Une seule source : `src/content/faq.ts`. |
| Vert utilisé pour « Prix en ligne » et pour « Position trouvée » | `remorquage/page.tsx` l. 59, `request-flow.tsx` l. 491 | Le vert est réservé à WhatsApp. |
| Le compteur de prix écrit des valeurs intermédiaires dans le texte | `request-flow.tsx` l. 805-824 et 874 | Composant `Odometer` : le vrai texte est là immédiatement, les rouleaux sont décoratifs. |
| Le même bandeau jaune arrondi en bas de chaque page | `page-blocks.tsx` l. 144-184 | Une aube propre à chaque page. |

---

## B. Langage visuel définitif

### B.1 Couleurs (jetons `@theme` dans `src/app/globals.css`)

**Jetons existants, conservés tels quels :**
- `asphalt-50…950` ;
- `signal-100…700` ;
- `beacon-400/500/600` ;
- `chalk` ;
- `whatsapp`, `whatsapp-dark`.

**Nouveaux jetons :**

| Jeton | Valeur | Rôle, avec usage strict |
|---|---|---|
| `--color-night-950` | `#05070d` | Haut du ciel à minuit, fond des panneaux lumineux |
| `--color-night-900` | `#0b1222` | Ciel de nuit, fond sous l'horizon du pied de page |
| `--color-night-800` | `#121a2e` | Horizon de nuit |
| `--color-dusk-700` | `#18294a` | Heure bleue |
| `--color-dusk-500` | `#3a3358` | Avant l'aube. **C'est la couleur la plus claire autorisée pour le ciel global.** |
| `--color-dawn-rose` | `#b9675a` | Bande d'aube **locale** (aube de fin de page, pied de page). Jamais derrière du texte. |
| `--color-dawn-gold` | `#eaa868` | Soleil et bas de la bande d'aube locale |
| `--color-sodium` | `#ffd27a` | Lampadaires et fenêtres (valeur aujourd'hui écrite en dur dans `night-road.tsx`) |
| `--color-led` | `#ffb21a` | Panneau à messages, seulement |
| `--color-led-off` | `#1a1408` | Points éteints du panneau à messages |
| `--color-xenon` | `#e3ecff` | Phares et faisceaux |
| `--color-reflect` | `#fffdf6` | Reflet rétroréfléchissant, jamais en fond |
| `--color-brake` | `#ff4b3a` | Feux arrière et roues bloquées, en décor seulement, 1 à 2 % de la surface |
| `--color-motorway-600` | `#1d4fa3` | Panneaux d'autoroute **dans les scènes d'autoroute uniquement** |
| `--color-water` | `#1b3550` | Seine, Marne et canal sur le plan |
| `--color-paper` | `#f2efe6` | Papier du ticket, seul objet clair de la nuit |
| `--color-ink` | `#16181b` | Encre du ticket |
| `--color-blueprint` | `#0e1f3a` | Plan technique de /entreprise, toujours dans un cadre |

**Règles de sens :** une couleur porte un seul sens, comme sur la route.

| Couleur | Sens | Interdits |
|---|---|---|
| **Jaune** (`signal-500`) | L'action principale, le trajet de votre véhicule, les mots-clés éclairés | **Un seul élément jaune plein par écran**, hors en-tête et barre d'action |
| **Orange** (`beacon`) | Urgence, sécurité, RNB AUTO en intervention (gyrophare), « À COMPLÉTER » | Jamais décoratif |
| **Vert** | WhatsApp | Jamais pour dire « disponible » ou « validé » |
| **Bleu autoroute** | L'autoroute | Jamais associé à RNB AUTO |
| **Clair** | Le ticket, la plaque d'entrée des pages légales, la bande d'aube locale | Aucune section claire en pleine largeur |

**Proportions par écran :**
- environ 75 % de nuit ou d'asphalte ;
- environ 15 % de craie (texte) ;
- 8 % de jaune au plus ;
- 2 % d'orange au plus.

### B.2 Contrastes vérifiés (ratio WCAG, calculé)

| Fond | `signal-500` | `chalk` | `asphalt-200` | `asphalt-300` | `asphalt-400` | `beacon-500` |
|---|---|---|---|---|---|---|
| `night-950` | 12,6 | 18,2 | 12,7 | 8,1 | 4,7 | 7,7 |
| `night-900` | 11,7 | 16,9 | 11,8 | 7,6 | 4,3 | 7,2 |
| `dusk-700` | 9,0 | 13,0 | 9,1 | 5,8 | **3,3** | 5,5 |
| `dusk-500` | 7,3 | 10,6 | 7,4 | 4,7 | **2,7** | **4,5** |
| `blueprint` | 10,3 | 14,8 | 10,4 | 6,7 | **3,8** | 6,3 |

**Autres paires :**

| Paire | Ratio |
|---|---|
| Texte `asphalt-950` sur `signal-500` | 12,5 |
| Texte `asphalt-950` sur `beacon-500` | 7,6 |
| Texte `asphalt-950` sur `whatsapp` | 10,0 |
| `ink` sur `paper` | 15,5 |
| `asphalt-500` sur `paper` | 6,5 |
| `chalk` sur `motorway-600` | 7,0 |
| `chalk` sur `dawn-rose` | **3,7** |

**Règles qui en découlent :**
- `asphalt-400` est **interdit pour tout texte** posé sur le ciel.
- Texte courant : `asphalt-300` au minimum sur `minuit`, `nuit` et `bleue`. Sur l'état `aube`, `asphalt-200` au minimum.
- Aucun texte sur `dawn-rose` ni `dawn-gold`.
- Pas de texte orange sur le ciel `aube`.
- Le tampon « EXEMPLE » (`beacon-600` sur papier, 3,05) est décoratif. L'information est répétée en texte noir dans le pied du ticket.

### B.3 Typographie (Archivo variable : largeur 62 à 125, graisse 100 à 900)

Les tailles sont des jetons `@theme` en `--text-*`, avec leur interligne. Les utilitaires sont des `@utility` de `globals.css`.

| Rôle | Utilitaire et jeton | Taille (390 → 1 440) | Largeur, graisse, interligne, espacement | Usage |
|---|---|---|---|---|
| Titre d'ouverture | `font-display text-hero` | `clamp(3.4rem, 17vw, 8.5rem)`, soit 66 → 136 px | 62, 900, 0,92, capitales | Le titre principal de chaque page |
| Titre de section | `font-display text-display` | `clamp(2.5rem, 10.5vw, 6rem)`, soit 41 → 96 px | 62, 900, 0,92 | Les titres de section |
| Titre d'aube | `font-display text-dawn` | `clamp(3.75rem, 16vw, 11rem)` | 62, 900, 0,9 | Titre de fin de page |
| Inscription de panneau | `font-sign text-sign` | `clamp(1.25rem, 1rem + 1.4vw, 2rem)` | 112, 800, 1,05, +0,02em, capitales | Panneaux, menu, « Prochaine sortie » |
| Titre d'étape | `font-step text-step` | `clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem)` | 88, 800, 1,1 | Sous-titres |
| Accroche | `text-lead` | `clamp(1.125rem, 1rem + .5vw, 1.375rem)` | 100, 500, 1,5, `text-wrap: pretty` | Accroches |
| Texte courant | `text-body` | `clamp(1.0625rem, 1rem + .2vw, 1.125rem)`, soit 17 → 18 px | 100, 400, 1,6 ; 68 caractères au plus par ligne | Paragraphes |
| Petit texte | `text-small` | 0,9375rem (15 px) | 100, 500, 1,5 | Aides, légendes. **Pas plus petit**, sauf les plaques. |
| Plaque PK | `font-plate text-plate` | 0,75rem | 125, 800, +0,2em, capitales | Étiquettes décoratives |
| Chiffres | `font-figure` | selon le contexte (prix : `clamp(4.5rem, 22vw, 7.5rem)`) | 75, 900, chiffres de largeur fixe | Prix, km, numéros, téléphone |
| LED | `font-led text-led` | `clamp(1.375rem, 1rem + 1.5vw, 2rem)` | 100, 800, +0,08em, capitales | Panneau à messages |

**Règles :**
- `text-wrap: balance` sur tous les titres.
- **Jamais d'animation de largeur** sur un texte de plusieurs lignes ni sur un paragraphe.
- Le masque à points (LED) seulement sur un texte de 20 px ou plus.
- Le numéro de téléphone n'est jamais animé.
- Les utilitaires existants `font-display`, `font-wide`, `font-condensed` et `tabular` sont conservés.

### B.4 Espacements, grille, formes

**Espacements :**
- base de 4 px ;
- `--space-section: clamp(4.5rem, 3rem + 6vw, 9rem)` en haut et en bas de chaque section ;
- marges latérales : 16 px sur mobile, 24 px à partir de `sm`, 32 px à partir de `lg`.

**Grille :**
- contenu de 1 280 px au maximum (`max-w-7xl`) ;
- 4 colonnes sur mobile, 8 à partir de `md`, 12 à partir de `lg` ;
- les scènes vont jusqu'aux bords de l'écran.

**Formes :**

| Élément | Arrondi | Détail |
|---|---|---|
| Plaques (panneaux) | 6 px | Liseré intérieur de 2 px en `rgb(255 253 246 / .14)` |
| Boutons | 16 px | — |
| Ticket | 4 px | Bord perforé |
| Puces (communes, libellés) | complètement arrondies | — |

**Ce qui disparaît :**
- **plus de `rounded-3xl`** sur des blocs de contenu ;
- plus de bordure `white/10` répétée sur des cartes ;
- plus de grille de cartes.

**Séparateurs :** tirets de marquage au sol (60/60) ou rangée de chevrons. Jamais de filet gris.

### B.5 Textures

- **Grain de bitume :** `public/textures/grain.png`, tuile de 128 px en niveaux de gris avec transparence, 6 Ko au plus, opacité 0,05. Elle est posée **dans le ciel, sous le contenu**, et jamais animée. Elle remplace l'utilitaire `asphalt-grain`, qui devient `grain`.
- **Marquages :** ligne de rive et tirets en SVG (60/60), chevrons jaunes et noirs (utilitaire existant), plots rétroréfléchissants (points craie à 40 %).
- **Microprismes :** deux `repeating-linear-gradient` à 60° et 120° (transparence 0,04). On ne les voit que dans le reflet rétroréfléchissant.
- **Panneau à messages :** fond de points éteints en `led-off`, glyphes allumés par un masque `radial-gradient` sur une trame de 4 px.
- **Papier du ticket :** fond `paper`, bord perforé par un masque radial répété (statique), grain fin à 3 %.
- **Route mouillée :** sous chaque source de lumière, un reflet vertical étiré (dégradé, `scaleY(2.5)`, opacité 0,25), statique. Seul le reflet du gyrophare suit la pulsation du gyrophare.

### B.6 Lumière : chaque lueur a une source

| Source | Couleur | Sens | Technique | Règles |
|---|---|---|---|---|
| Lampadaire au sodium | `sodium` | Ambiance et rythme | Cône en dégradé linéaire, flaque au sol, reflet mouillé | Statique, ou défilement de la scène |
| Phares | `xenon`, faisceau `#fff3b0` (existant) | Révéler ce qu'il faut lire | Faisceau polygonal en dégradé, BeamSweep sur les titres | Le faisceau passe sur un texte **déjà visible** |
| Gyrophare | `beacon-500` | RNB AUTO en intervention | Halos radiaux alternés (`beacon-flash` existant, 1,2 s) et reflet au sol | Uniquement autour de la dépanneuse. Jamais sur un bouton. |
| Feux de détresse | `beacon-400` | Détresse du client | `.hazard` : 1 Hz (500 ms allumé, 500 ms éteint), petite surface | Période du gyrophare ≈ 2 × celle des feux de détresse : les deux lumières se répondent |
| LED | `led` | Information qui change | `Pmv` | Contenu factuel uniquement |
| Rétroréflexion | `reflect` | « Ceci est éclairé, ceci est confirmé » | `data-retro` (balayage unique) | — |
| Aube | `dawn-rose`, `dawn-gold` | Fin du parcours, soulagement | Bandes locales | Jamais derrière du texte |

**Interdits :**
- `filter: blur()` sur un grand élément ;
- un halo sans source ;
- un flash plein écran ;
- plus de deux boucles visibles en même temps.

### B.7 Illustrations SVG faites main

**Style :**

- **Vue de profil (l'émotion)** : silhouettes pleines en `asphalt-800/850`, un liseré de 1 à 1,5 px dans la couleur de la source la plus proche, un seul aplat de couleur de marque (les bandes jaunes de la dépanneuse).
- **Vue de dessus (la compréhension)** : trait de 2 à 2,5 px aux bouts arrondis, peu de remplissage.
- **Pictogrammes des boutons** : le jeu `Icon` existant (grille de 24, trait de 2 px) reste la seule iconographie des boutons. Les nouveaux pictogrammes respectent la même grille.
- **Dégradés** : seulement pour la lumière.
- **Personnes** : seulement des silhouettes de pictogramme, sans visage.
- **Interdits** : photos, logos de tiers (sociétés d'autoroute), reproduction exacte d'un panneau réglementaire, **dépanneuse RNB AUTO sur une voie d'autoroute**.
- **Accessibilité** : tout SVG décoratif porte `aria-hidden="true"`. Les identifiants internes sont préfixés (prop `id`) pour rester uniques dans la page.

**Inventaire, avec le lot qui fabrique chaque élément :**

| Élément | Lot |
|---|---|
| `TowTruck` étendu (plateau incliné, câble, miroir, version plan technique, parties nommées) | S1 |
| Horizon de ville en deux couches (fichiers statiques) | S1 |
| Lampadaires | S1 |
| Dépôt (bâtiment, rideau métallique, enseigne losange) | S1 |
| Voiture du client de profil (feux de détresse, capot ouvert) | S2b |
| Vues de dessus (dépanneuse avec cône de phares, voiture, épingle « Vous », drapeau, dépôt) | S2b |
| Tracés de trajets | S2b |
| Plan RNB (carte schématique de l'Île-de-France) | S2b |
| Panneau de direction, plaque d'information, voyants, ticket, trois trajets, relais d'autoroute, séquence de chargement | S2b |
| Scènes propres à une page (bas-côté, bande d'arrêt d'urgence, route en « ? », plan technique, déviation…) | lot de la page |

### B.8 Les objets d'interface, qui remplacent les cartes

| Objet | Anatomie | Usages |
|---|---|---|
| **Panneau de direction** (lien) | Plaque de 6 px d'arrondi, pictogramme dans un carré, inscription en `font-sign`, ligne d'aide, flèche orientée | Carrefour, Prochaine sortie, situations |
| **Plaque d'information** | Plaque sombre, numéro ou pictogramme, titre en `font-step`, texte | Réflexes, garanties, engagements, relais |
| **Voyant** | Pictogramme de témoin de tableau de bord, allumé en ambre (ou rouge pour « accident »), libellé et texte | /depannage, problème dans /demande |
| **Ticket** | Papier perforé : en-tête losange « RNB AUTO · ESTIMATION », prix en haut, lignes cochées sans montant, pied | Accueil, /remorquage, /demande |
| **Panneau à messages (PMV)** | Matrice de LED ambre, un message à la fois | Portique de l'accueil, annonce |
| **Plaque PK** | « PK 03 · LE PRIX » en `font-plate` avec une petite borne à tête jaune. La partie « PK 03 · » est `aria-hidden`. | Surtitre de chaque section |
| **Borne** | Numéro d'étape en `font-figure` sur une borne | Étapes |
| **Puce** | Pastille arrondie | Communes, départements, facteurs du prix |

---

## C. Système de motion

### C.1 Le code de la route du motion (règles non négociables)

1. Une scène principale par écran. Le reste est immobile ou presque.
2. **Les éléments sur lesquels on agit ne sont jamais à opacité 0, retardés ni recouverts.** C'est le cas d'Appeler, WhatsApp, des liens vers /demande, des boutons et de la navigation. Ils peuvent recevoir un reflet au survol, jamais une apparition.
3. Le titre principal, l'accroche et le bouton principal de chaque page sont statiques dès la première image.
4. Tout texte est lisible au plus tard 700 ms après son entrée dans l'écran.
5. **Mobile :** aucun épinglage, aucun élément collant pour les récits, aucun défilement horizontal piloté, défilement natif.
6. **Ordinateur :** aucun `pin` GSAP. Les scènes collantes utilisent `position: sticky` ; ScrollTrigger ne fait que lire la progression.
7. **Propriétés animées :**
   - `transform` et `opacity` ;
   - `clip-path` sur un seul élément à la fois ;
   - `stroke-dashoffset` sur des tracés SVG ;
   - `background-position` pour le faisceau, sur deux titres au plus par écran.
   
   Jamais `filter`, `box-shadow`, `width`, `height`, `top` ni `left`.
8. Deux boucles infinies visibles au plus. Elles se mettent en pause hors de l'écran.
9. Clignotement : 1 Hz au plus, sur de petites surfaces.
10. Aucun son, jamais.
11. **Sans JavaScript, tout est visible.** Les états cachés n'existent que sous `html.motion-ready`, classe posée par le runtime après une initialisation réussie.
12. **État de base = état final.** L'état d'un élément sans animation est son état stable (feux allumés, tracés complets, dépanneuse arrivée). Les animations partent de là.

### C.2 Jetons de référence

**Durées** (propriétés sur `:root`, dans `src/styles/motion.css`) :

| Jeton | Valeur | Usage |
|---|---|---|
| `--dur-tap` | 120 ms | Retour au toucher (`scale(.98)`) |
| `--dur-ui` | 220 ms | Survol, changement d'étape de la demande |
| `--dur-reveal` | 500 ms | Apparition |
| `--dur-title` | 800 ms | Montée des lignes de titre |
| `--dur-beam` | 900 ms | Faisceau de phare |
| `--dur-scene` | 900 ms | Tracé d'un trajet joué une fois |
| `--dur-sky` | 900 ms | Changement d'heure du ciel |
| `--dur-page-out` | 140 ms | Sortie de page |
| `--dur-page` | 360 ms | Entrée de page |
| `--dur-print` | 900 ms sur l'accueil, 450 ms sur /demande | Impression du ticket |
| `--dur-odometer` | 1 100 ms sur l'accueil, 700 ms sur /demande | Compteur |

**Courbes** (CSS ; équivalent GSAP pour les scènes) :

| Jeton CSS | Valeur | GSAP | Usage |
|---|---|---|---|
| `--ease-out-expo` (existant) | `cubic-bezier(.16,1,.3,1)` | `expo.out` | Arrivées, apparitions, titres |
| `--ease-brake` | `cubic-bezier(.2,.8,.2,1)` | `power3.out` | Véhicule qui freine |
| `--ease-accel` | `cubic-bezier(.55,0,.75,.2)` | `power2.in` | Véhicule qui démarre, sortie de page |
| `--ease-beam` | `cubic-bezier(.45,0,.55,1)` | `sine.inOut` | Faisceaux, balayages |
| `--ease-out-back` (existant) | `cubic-bezier(.34,1.56,.64,1)` | `back.out(1.7)` | Épingle qui tombe, tampon |
| — | `steps(n)` | `steps(n)` | Impression, LED |

**Cascades :**
- 60 ms entre éléments ;
- trois paliers au plus pour les apparitions (180 ms) ;
- 40 ms pour l'allumage de groupes (8 éléments au plus).

**Amplitudes :**
- apparition : 16 px sur mobile, 24 px sur ordinateur ;
- parallaxe : 8 vh au plus sur ordinateur, 4 vh sur mobile ;
- aucune rotation de l'écran entier ; la bascule de caméra reste dans un cadre.

### C.3 Niveaux de motion

Le niveau est posé sur `<html data-motion="full|lite|off">` **avant le premier affichage**, par un script en ligne. La politique de sécurité du site autorise déjà `'unsafe-inline'` (`next.config.ts` l. 11).

| Niveau | Quand | Effets |
|---|---|---|
| `full` | Par défaut | Tout ce qui est décrit. Sur ordinateur (pointeur fin, ≥ 1 024 px) : scènes collantes, Lenis, halo. |
| `lite` | `navigator.connection.saveData`, ou `deviceMemory ≤ 2`, ou `hardwareConcurrency ≤ 2` | Ni Lenis, ni halo, ni parallaxe, ni montée des lignes, ni scène liée au défilement : les scènes jouent une fois. Scintillement coupé. Ciel en 400 ms. |
| `off` | `prefers-reduced-motion: reduce`, ou bouton « Arrêter les animations » (mémorisé en `localStorage` sous `rnb-motion`) | Aucun mouvement : états finaux, ni boucle, ni animation liée au défilement, ni animation de transition de page. Le ciel change sans transition. |
| Sans JavaScript | — | Les boucles CSS de l'ouverture tournent, sauf préférence système contraire. Tout le reste est à l'état final. Rien n'est caché. |

**Script d'en-tête** (`MOTION_BOOT_SCRIPT`, environ 400 octets). Il ajoute `html.js`, lit le stockage dans un `try/catch`, puis la préférence système, `saveData`, `deviceMemory` et `hardwareConcurrency`, et pose `data-motion`. La même logique existe en TypeScript pur (`detectMotionLevel`). Un test exécute les deux sur toutes les combinaisons d'environnement et vérifie qu'elles donnent le même résultat.

### C.4 Architecture d'exécution

**Démarrage :**

1. **Avant l'affichage :** `MotionHeadScript` (premier enfant du layout public) pose `html.js` et `data-motion`.
2. **Après hydratation :** `MotionRuntime`, composant client sans GSAP de 4 Ko compressés au plus, monté dans le layout public, fait ceci au montage et à chaque changement de `pathname` :
   - **Observateurs :**
     - un IntersectionObserver « vu une fois » pose `data-inview` sur `[data-reveal]` et `[data-inview-once]` ; les éléments déjà dans l'écran sont marqués tout de suite ;
     - un deuxième met en pause les scènes hors écran (`.scene-paused`, existant) ;
     - un troisième lit la bande centrale de l'écran (`rootMargin: "-50% 0px -50% 0px"`) et recopie le `data-sky` de la section active sur `<html>` ; il pose aussi `aria-current="location"` sur les liens `[data-follow-section]` qui pointent vers la section active.
   - **Classe `.motion-ready` :** posée seulement si le niveau n'est pas `off`, après le marquage des éléments visibles.
   - **Origine des transitions :** un écouteur `click` en capture, sur les liens internes, écrit `--vt-x` et `--vt-y` sur `<html>`. C'est le point touché, ou le centre du lien pour un clavier.
   - **Repli de la progression :** si `animation-timeline` n'est pas pris en charge, la progression est calculée en JavaScript (écoute passive du défilement, puis `requestAnimationFrame`).
   - **Halo** (P21) : ordinateur, niveau `full`, hors des routes calmes (`CALM_ROUTES`), des routes sans halo (`NO_HALO_ROUTES`) et des pages marquées `data-calm` (404, erreur). Le marqueur est relu s'il apparaît après coup : le halo s'éteint, puis revient si le marqueur disparaît (voir J, L9-F1-2).
   - **Chargement différé :** au premier `requestIdleCallback` (délai maximal 1 500 ms ; `setTimeout(1200)` sur Safari), au premier défilement ou au premier toucher. Seulement si la page contient `[data-split]`, `[data-stage]`, `[data-route-mode="scrub"]` ou une scène qui l'exige, et si le niveau n'est pas `off`. Le chargement :
     - importe une seule fois `gsap`, `gsap/ScrollTrigger` et `gsap/SplitText` (avec `ScrollTrigger.config({ ignoreMobileResize: true })`) ;
     - lance les aides globales (montée des lignes, scènes collantes, tracés liés au défilement) ;
     - lance les scènes enregistrées qui approchent de l'écran (`rootMargin: "100%"`).
   - **Lenis :** sur ordinateur (`pointer: fine`, niveau `full`, hors routes calmes et hors pages marquées `data-calm` ou `data-calm="full"`). Import dynamique, `anchors: true`, branché sur `ScrollTrigger.update` quand GSAP est chargé. Une seule instance, détruite et recréée à chaque page. Il s'arrête quand le menu est ouvert. Quand un champ a le focus, il rend la molette au défilement natif (`smoothWheel: false`) au lieu de s'arrêter (voir J, S1-18).
   - **Polices :** `document.fonts.ready` déclenche `ScrollTrigger.refresh()`.
   - **Changement de niveau :** l'événement `rnb:motion-change` (bouton) ou la préférence système qui change entraîne un nouveau calcul. En `off`, les contextes GSAP sont annulés, SplitText est retiré, Lenis est détruit et `.motion-ready` est retiré.
3. **Changement de page :** tous les contextes de la page précédente sont annulés (`gsap.context().revert()`, observateurs déconnectés), puis le cycle recommence.
4. **Erreurs :** chaque aide et chaque scène s'exécute dans un `try/catch`. En cas d'échec, l'élément garde son état final (`data-scene-failed`) et rien n'est caché.

**Modules de scène** (le point d'extension des lots) :

```ts
// src/components/motion/types.ts
export type MotionLevel = "full" | "lite" | "off";
export type SkyState = "minuit" | "nuit" | "bleue" | "aube";
export type GsapKit = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  SplitText: typeof import("gsap/SplitText").SplitText;
};
export type SceneHelpers = {
  /** Trace un chemin pathLength="1" (0 → 1) via --draw. Suit aussi `data-draw-mask="<id>"`. */
  setDraw(el: SVGGeometryElement | SVGGElement, progress: number): void;
  /** Place un groupe sur un chemin (getPointAtLength) et l'oriente dans le sens de la marche. */
  follow(el: SVGGraphicsElement, path: SVGGeometryElement, progress: number, opts?: { rotate?: boolean }): void;
  /** Petite interpolation sans GSAP (requestAnimationFrame). Retourne une fonction d'arrêt. */
  tween(opts: { duration: number; ease?: (t: number) => number; onUpdate: (p: number) => void; onComplete?: () => void }): () => void;
};
export type SceneContext = {
  level: Exclude<MotionLevel, "off">;
  desktop: boolean; // (min-width: 1024px) and (pointer: fine)
  kit: GsapKit | null; // non nul si le module déclare needsGsap (ou si sa fonction a répondu vrai)
  helpers: SceneHelpers;
};
/** Ce que le runtime sait AVANT d'initialiser une scène (pour décider de charger GSAP). */
export type SceneGsapQuery = { level: Exclude<MotionLevel, "off">; desktop: boolean };
export type SceneModule = {
  needsGsap?: boolean | ((query: SceneGsapQuery) => boolean);
  init(root: HTMLElement, ctx: SceneContext): void | (() => void);
};
export type SceneLoaders = Record<string, () => Promise<{ default: SceneModule }>>;
```

- **Composant client de chaque page** (`home-scenes.tsx`, `depannage-scenes.tsx`…) : il appelle `useScenes({ "hero-brake": () => import("./scenes/hero-brake.scene") })`.
- **Rendu serveur de chaque scène :** `<div data-scene="hero-brake">`.
- **Le runtime** associe les deux, initialise la scène quand elle approche de l'écran, et la nettoie à chaque changement de page.
- **Aucun registre partagé à modifier :** chaque lot enregistre ses propres scènes.

**Contrat des attributs `data-*`** (fixé par S1) :

| Attribut | Posé par | Effet | Primitive |
|---|---|---|---|
| `data-sky="minuit\|nuit\|bleue\|aube"` | Section | Heure du ciel | P1 |
| `data-reveal`, `data-reveal-step="1\|2\|3"` | Bloc de texte, illustration | Apparition (interdit sur les actions) | P2 |
| `data-inview-once` → `data-inview` | Élément ; posé par le runtime | Déclenche une animation unique en CSS | P3 |
| `data-beam="load\|view"` | `<em>` d'un titre | Faisceau de phare | P4 |
| `data-split` | Titre de section (jamais le titre principal) | Montée des lignes | P5 |
| `data-retro` | Plaque, voyant, borne | Reflet rétroréfléchissant | P6 |
| `data-parallax` + `style="--depth: .3"` | Couche de décor | Parallaxe | P7 |
| `data-tilt-cam` | Plan d'une carte | Bascule de caméra | P8 |
| `data-stage`, `data-stage-visual`, `data-stage-step` ; `data-beat`, `data-active` (posés) | Scène collante | Temps d'une scène | P9 |
| `data-route`, `data-route-mode="scrub\|view\|loop\|static"`, `data-route-leg`, `data-route-truck` | Tracés (`RoutePaths`) | Trajets qui se dessinent | P10 |
| `data-print="view\|mount"` | Ticket | Impression | P12 |
| `data-ignite` | Groupe de voyants | Mise du contact | P15 |
| `data-arrive` | Enveloppe d'un véhicule | Arrivée et freinage | P16 |
| `data-pause-offscreen` (existant) | Scène | Pause hors écran | P20 |
| `data-scene="<nom>"` | Racine d'une scène de lot | Module de scène | P22 |
| `data-follow-section` | Lien d'ancre | `aria-current` sur la section active | D.3 |
| `data-page="demande"` | Racine du parcours | Règles `:has` propres à /demande | D.7 |

### C.5 Catalogue des primitives

Chaque primitive est décrite par : son effet, sa technique, son comportement sur mobile, en « moins d'animations » (`off`) et sans JavaScript.

**P1 · NightSky (le ciel continu)**, composant `<NightSky/>` dans le layout et `data-sky` sur chaque section.
- **Effet :** un ciel fixe derrière tout le site. Il passe de minuit à la nuit, à l'heure bleue puis à l'aube, section après section. La lueur orangée de la ville s'éteint à l'heure bleue. Les étoiles sont fixes.
- **Technique :**
  - un `div` en `position: fixed; inset: 0; height: 100lvh; z-index: 0; pointer-events: none; aria-hidden` ;
  - couleurs portées par des propriétés enregistrées (`@property --sky-top/--sky-mid/--sky-low { syntax: "<color>" }`) et `--city-glow`/`--stars` (`<number>`), avec `transition: var(--dur-sky)` ;
  - un seul calque de dégradés, puis la tuile de grain (opacité 0,05) ;
  - la repeinte n'a lieu que pendant les 900 ms d'un changement d'heure, jamais à chaque image de défilement.
- **États :**

  | État | `--sky-top` | `--sky-mid` | `--sky-low` | Lueur de ville | Étoiles | Où |
  |---|---|---|---|---|---|---|
  | `minuit` (par défaut) | `#05070d` | `#0b1222` | `#141a2a` | 0,10 | 1 | Ouvertures, 404 |
  | `nuit` | `#070a12` | `#0b1222` | `#121a2e` | 0,06 | 0,8 | Corps des pages, /demande, pages légales |
  | `bleue` | `#0b1222` | `#18294a` | `#1f3157` | 0 | 0,4 | Autoroute, zones, fin de corps de page |
  | `aube` | `#121a2e` | `#241f3d` | `#3a3358` | 0 | 0,15 | Aube de fin de page, pied de page, demande envoyée |

  Le ciel global ne dépasse jamais `#3a3358` : les vraies couleurs d'aube (rose, or) sont **locales**.
- **Étoiles :** 12 points (mobile) ou 24 (ordinateur) en `radial-gradient` dans la moitié haute. Six scintillent (3 à 5 s), sur ordinateur et en niveau `full` seulement.
- **Mobile :** identique, avec moins d'étoiles et sans scintillement.
- **`off` :** changement d'heure instantané, aucun scintillement.
- **Sans JavaScript :** `minuit` fixe. Les aubes locales restent visibles.

**P2 · Reveal**, attributs `data-reveal` et `data-reveal-step`.
- **Effet :** paragraphes, plaques et illustrations montent de 16 px (24 px sur ordinateur) en apparaissant (500 ms, `--ease-out-expo`), avec trois paliers de 60 ms au plus.
- **Technique :** transitions CSS sur `.motion-ready [data-reveal]:not([data-inview])` (logique existante de `page-motion.tsx`, reprise dans le runtime). Le seuil est à 92 % de l'écran.
- **Interdits :**
  - tout lien `tel:`, `wa.me` ou `/demande`, et tout bouton ;
  - un conteneur qui en contient un ;
  - les titres principaux ;
  - les consignes de sécurité et le message réglementaire ;
  - les éléments de /demande et de /contact.
- **`off` et sans JavaScript :** visibles d'emblée.

**P3 · InView**, attribut `data-inview-once`.
- **Effet :** sert de déclencheur générique aux animations uniques en CSS (impression, arrivée, allumage, remplissage du « RNB AUTO » doré).
- **Technique :** le runtime pose `data-inview`. Les règles CSS de démarrage sont dans `motion.css` ou dans le module CSS du composant.

**P4 · BeamSweep (le faisceau de phare)**, `data-beam="load"` (ouvertures) ou `data-beam="view"` (aubes, titres clés).
- **Effet :** une bande de lumière `#fff8dc` passe de gauche à droite sur un mot **déjà allumé**, en jaune ou en craie.
- **Technique :**
  - `background-image: linear-gradient(100deg, currentColor 0 40%, #fff8dc 48%, currentColor 56% 100%)`, avec `background-size: 260% 100%`, `background-clip: text` et `-webkit-text-fill-color: transparent` ;
  - animation de `background-position` de `100%` à `0%` ; aux deux extrémités, le texte a exactement sa couleur ;
  - `load` : 900 ms, délai de 200 ms, `--ease-beam`, une seule fois ;
  - `view` : `animation-timeline: view(); animation-range: entry 20% cover 45%`, sous `@supports` ;
  - **déclarer `animation-timeline` après le raccourci `animation`**, qui le remettrait sinon à sa valeur par défaut.
- **Sécurité :**
  - sous `@supports not (background-clip: text)`, aucun dégradé ;
  - sous `@media (forced-colors: active)`, `background: none; -webkit-text-fill-color: currentColor` ;
  - jamais combiné à `data-split` sur le même titre ;
  - deux titres au plus par écran.
- **`off` et sans JavaScript :** texte allumé, aucune animation.

**P5 · LineRise (la montée des lignes)**, attribut `data-split` sur un titre de section.
- **Effet :** chaque ligne monte depuis un masque (`yPercent: 110` et `rotate: 2` vers 0, 800 ms, `expo.out`, cascade de 70 ms).
- **Technique :**
  - `SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true, aria: "auto", onSplit })`, après `document.fonts.ready` ;
  - déclenchement à `top 86%`, une seule fois ;
  - **pas de découpage** pour un titre déjà dans l'écran à l'initialisation, pour éviter qu'il clignote ;
  - classe de masque `.split-line-mask` (existante).
- **Mobile :** identique.
- **`lite`, `off` et sans JavaScript :** titre tel quel.

**P6 · Retroreflect (le reflet)**, attribut `data-retro`.
- **Effet :** une bande blanche traverse la plaque une fois, et les microprismes apparaissent brièvement.
- **Technique :**
  - pseudo-élément `::after` en `linear-gradient(105deg, transparent 40%, var(--color-reflect) 50%, transparent 60%)`, déplacé de `translateX(-110%)` à `translateX(110%)`, sur un parent en `overflow: clip` ;
  - CSS seul : `animation-timeline: view(); animation-range: cover 35% cover 65%`, c'est-à-dire quand la plaque traverse le milieu de l'écran ;
  - repli : `[data-retro][data-inview]` joue un balayage de 900 ms dans le temps ;
  - sur ordinateur, le balayage se rejoue au survol et au focus ;
  - pas de `mix-blend-mode`.
- **`off` :** liseré allumé, sans balayage.
- **Sans JavaScript :** CSS seul là où c'est pris en charge, sinon statique.

**P7 · Parallax**, attribut `data-parallax` avec `style="--depth: 0.1 à 0.6"`.
- **Technique :** `translate: 0 calc(var(--depth) * ±8vh)` piloté par `animation-timeline: view(); animation-range: cover`. Aucun repli JavaScript.
- **Mobile :** amplitude divisée par deux, deux couches au plus.
- **`lite`, `off`, navigateurs sans prise en charge :** statique.

**P8 · CameraTilt (le plan grue)**, attribut `data-tilt-cam` sur le plan, à l'intérieur d'un cadre `.tilt-cam-frame` (`perspective: 900px`).
- **Effet :** on part au ras de la route, qui fuit vers l'horizon. Le plan se redresse et devient la carte. Le même `<path>` sert de route puis de trajet.
- **Technique :**
  - CSS, `rotateX(var(--tilt-from)) scale(1.2)` vers `rotateX(0) scale(1)` ;
  - `--tilt-from` vaut 60° sur ordinateur et 55° sur mobile ;
  - sur ordinateur, timeline nommée de la section (`view-timeline-name: --story`, `animation-range: contain 0% contain 15%`) ;
  - sur mobile, `view()` de la première mini-carte ;
  - le texte n'est jamais dans le plan 3D.
- **`off` :** carte à plat.

**P9 · StickyStage (la scène collante)**, attributs `data-stage`, `data-stage-visual` et `data-stage-step`.
- **Ordinateur :**
  - le visuel est en `lg:sticky lg:top-0 lg:h-screen` ;
  - les textes défilent (80 vh par temps) ;
  - l'aide ScrollTrigger pose `data-active` sur l'étape qui traverse la bande centrale, `data-beat="n"` et `--stage-progress` sur la scène.
- **Mobile :** rien de collant. Chaque étape porte son propre petit visuel ; l'aide ne fait rien.
- **Règle :** **pas de `overflow: hidden`** sur un ancêtre d'un élément collant (utiliser `overflow-x: clip`).
- **`off` :** visuels à l'état final à côté de chaque texte.

**P10 · RouteDraw (les trajets)**, composant `<RoutePaths>` et attributs `data-route…`.
- **Effet :** un trajet se dessine, et une dépanneuse vue de dessus le suit en s'orientant, avec son cône de phares.
- **Technique :**
  - chaque tronçon est un `path` en `pathLength="1"`, avec `stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--draw))` (`@property --draw`, initial 1, donc dessiné par défaut) ;
  - les tronçons en pointillés sont révélés par un **masque** dont le tracé plein porte `--draw`, ce qui garde les tirets ;
  - le véhicule est placé par `getPointAtLength` et `atan2` (`helpers.follow`).
- **Modes :**
  - `scrub` : ScrollTrigger lit la progression (ordinateur) ;
  - `view` : `helpers.tween` de 900 ms par tronçon, une fois, à l'entrée ;
  - `loop` : tracé qui recommence (attente du calcul dans /demande) ;
  - `static` : rien ne bouge.
- **Styles des tronçons :**

  | Tronçon | Style |
  |---|---|
  | `aller` | Pointillé craie à 70 % |
  | `transport` | Jaune plein, épais : c'est votre véhicule |
  | `retour` | Pointillé `asphalt-400` fin |
  | `agree` (dépanneur agréé) | Gris neutre |

- **`off` et sans JavaScript :** tracés complets, véhicule à l'arrivée.

**P11 · Odometer (le compteur)**, composant client `<Odometer value unit trigger duration />`.
- **Effet :** les chiffres roulent comme ceux d'un compteur kilométrique, de droite à gauche, avec une cascade de 60 ms.
- **Technique :**
  - le serveur rend le **vrai texte** (« 105 € ») ;
  - le client ajoute des colonnes 0 à 9 en `aria-hidden` et en chiffres de largeur fixe (aucun décalage de mise en page) ;
  - pendant le roulement, le vrai texte reste dans l'arbre d'accessibilité (masqué visuellement) ; il redevient visible à la fin et les colonnes sont retirées ;
  - transitions CSS sur `translateY`, sans GSAP.
- **Ne s'applique jamais** à un numéro de téléphone ni à une référence de demande.
- **Valeur :** toujours celle du serveur (exemple du moteur, ou estimation).
- **`off` et sans JavaScript :** valeur fixe.

**P12 · TicketPrint (l'impression du ticket)**, `<EstimateTicket print="view|mount" />`.
- **Effet :** le ticket sort ligne par ligne. Le prix est **en haut du ticket**, donc il apparaît dans les 150 premières millisecondes. Les lignes se cochent, puis le compteur roule.
- **Technique :**
  - `clip-path: inset(0 0 calc(100% - var(--fed)) 0)` en `steps(n lignes)`, avec deux petites secousses en `translateY` ;
  - bord perforé par un masque statique ;
  - sur l'accueil, le tampon « EXEMPLE » frappe (`scale` de 1,4 à 1, 180 ms, `--ease-out-back`) ;
  - dans /demande, le tampon « REÇUE » apparaît à l'envoi.
- **`off` et sans JavaScript :** ticket complet.

**P13 · Pmv (le panneau à messages)**, composant client `<Pmv messages label size interval />`.
- **Effet :** une matrice de LED ambre. Les messages se remplacent colonne par colonne.
- **Technique :**
  - vrai texte masqué en points (`mask: radial-gradient(circle, #000 1.25px, transparent 1.6px) 0 0 / 4px 4px`), seulement à partir de 20 px ;
  - lueur `drop-shadow` **statique** sur le parent ;
  - effacement puis écriture en `clip-path` `steps(10)`, 280 ms chacun ;
  - un message toutes les 3,5 s ;
  - pause au survol, au focus, hors de l'écran, et avec le bouton « Pause » du panneau (critère WCAG 2.2.2).
- **Mobile :** deux lignes de 26 caractères au plus.
- **Accessibilité :** le visuel est `aria-hidden` ; une liste `sr-only` statique donne tous les messages.
- **`off` et sans JavaScript :** premier message affiché, fixe.

**P14 · Lights (les boucles de lumière)**, classes CSS.
- **Classes :**
  - `.hazard` : 1 Hz, sur `opacity` ;
  - `.beacon-glow` : `beacon-flash` existant, 1,2 s, halos alternés en dégradé radial ;
  - `.lamp` : cône et flaque, statiques ;
  - `.lamp-breathe` (404 seulement) : opacité de 0,85 à 1 sur 4 s, jamais un flash.
- **Règles :** toujours dans une scène `data-pause-offscreen` ; deux boucles visibles au plus.
- **`off` :** allumé et fixe. L'état de base est « allumé ».

**P15 · DashLight (la mise du contact)**, `<VoyantGroup>` avec `data-ignite`.
- **Effet :** à l'entrée, tous les voyants s'allument comme au contact : deux micro-scintillements en 220 ms, cascade de 40 ms, puis allumage fixe. Dans /demande, le voyant choisi s'allume seul.
- **Technique :** images clés CSS sur `opacity`, sur de petites surfaces, déclenchées par `data-inview`.
- **`off` et sans JavaScript :** allumés.

**P16 · Arrive & Brake (arrivée et freinage)**, attribut `data-arrive` sur l'enveloppe d'un véhicule.
- **Effet :** le véhicule entre et freine. Le nez plonge de −1,2° puis la caisse reprend sa place.
- **Technique :** CSS déclenché par `data-inview` : `translateX(-110%)` vers 0 en 1,4 s (`--ease-brake`), puis une image clé de 300 ms sur la caisse (`.truck-body`).
- **`off` et sans JavaScript :** véhicule arrêté à sa place.

**P17 · GroundText (texte peint sur la chaussée)**, composant `<GroundText text />`.
- **Effet :** des lettres peintes sur la route, très étirées, sur lesquelles la caméra « roule ».
- **Technique :**
  - cadre en `perspective: 520px; perspective-origin: 50% 0` ;
  - texte en `rotateX(70deg) scaleY(2.4) translateY(var(--y))`, peinture usée par un masque de grain ;
  - `--y` piloté par `animation-timeline: view()` ;
  - une seule couche, `aria-hidden`. Le vrai titre est ailleurs.
- **`off` :** figé.

**P18 · Accordion (les questions)**, composant `<FaqAccordion items />`.
- **Technique :**
  - `<details>` natif ;
  - ouverture animée par `interpolate-size: allow-keywords` et une transition sur `::details-content` (260 ms) quand le navigateur le permet, ouverture sèche sinon ;
  - le « + » tourne en « × » ;
  - un trait jaune s'allume à gauche de la réponse ouverte ;
  - zones de toucher de 56 px au minimum.
- **`off` :** ouverture instantanée.

**P19 · PageTransition et SharedMorph**, voir D.4.

**P20 · Pause et commandes**
- `<ScenePause targetId />` : bouton « Pause » ou « Lecture » dans le coin d'une scène qui tourne en boucle (ouverture de l'accueil). Il pose `.scene-paused` sur la cible.
- `<MotionToggle />` : dans le pied de page, bouton `aria-pressed` « Arrêter les animations » ou « Relancer les animations ».
  - Il est masqué sans JavaScript (`html:not(.js)`), ainsi que lorsque la préférence système est déjà « réduire ».
  - **C'est un `<button>`, jamais une case à cocher** (voir G.1).

**P21 · HeadlightHalo (le halo des phares)**
- **Effet :** sur ordinateur, une lumière chaude très douce suit la souris, sous le contenu. Elle fait ressortir le grain du bitume.
- **Technique :**
  - un `div` de 560 px dans le calque du ciel, en `radial-gradient(circle, rgb(255 236 200 / .06), transparent 60%)` ;
  - il suit le pointeur avec un lissage de 0,18 par image (`requestAnimationFrame` sans GSAP) et s'arrête à l'arrêt du pointeur ;
  - il est masqué quand un champ a le focus.
- **Absent :** sur mobile, en `lite` et en `off`, sur les routes calmes (`CALM_ROUTES`), sur les routes sans halo (`NO_HALO_ROUTES`) et sur les pages marquées `data-calm` (404, erreur).
- Le curseur système n'est jamais remplacé.

**P22 · Scènes de lot**, `useScenes` et `data-scene`. Voir C.4. Ce sont les seules chorégraphies propres à une page (freinage de l'ouverture, récit de l'accueil, séquence de chargement).

### C.6 Intensité par page

| Page | Primitives autorisées | GSAP | Lenis et halo |
|---|---|---|---|
| Accueil | Toutes | Oui (différé) | Oui |
| /depannage, /remorquage, /zones-d-intervention, /entreprise, /questions-frequentes | Toutes sauf P13 (sauf mention contraire) | Oui (différé) | Oui |
| /panne-autoroute | P1, P10 (`view`), P14 (feux de détresse seulement), P18, P19 | **Non** | Lenis seulement |
| /contact | P1, P14 (ondes autour de l'icône du téléphone), P19 | Non | Non |
| /demande | P1, P10 (`loop` et `view`), P11, P12, P15, P19, transitions CSS d'étape | Non | Non |
| Pages légales | P1, P19, progression de lecture | Non | Non |
| 404, erreur | P1, P14, P16 | Non | Non |

**`CALM_ROUTES`** = `/demande`, `/contact`, `/mentions-legales`, `/confidentialite`, `/conditions-d-intervention` (ni Lenis ni halo).

**`NO_HALO_ROUTES`** = `/panne-autoroute` (Lenis sans halo).

**Pages marquées `data-calm`** (404, erreur : leur adresse n'est pas connue d'avance) : `data-calm` ou `data-calm="full"` = ni Lenis ni halo ; `data-calm="halo"` = sans halo, Lenis gardé (J, L9-F1-2).

---

## D. Expérience globale

### D.1 Structure du layout public et ordre de superposition

```
<html class="js" data-motion="full|lite|off" data-sky="minuit|nuit|bleue|aube">
  (public)/layout.tsx
    <MotionHeadScript/>           script en ligne, premier enfant
    <a href="#contenu">Aller au contenu</a>          z 70
    <NightSky/>                   fixe, z 0 : dégradé, étoiles, grain, halo (z 5 interne)
    <SiteHeader phone whatsapp announcement/>       fixe, z 50 (menu : z 55)
    <main id="contenu" class="relative z-10">{page}</main>
    <SiteFooter info/>            relative z-10
    <ActionBar phone whatsapp/>   fixe, z 60, au-dessus de tout
    <MotionRuntime/>
  page.tsx (chaque page)
    <RoadLine markers/>           fixe (≥ 1 024 px), en dehors de la transition
    <PageTransition> … sections … </PageTransition>
```

**Règles :**
- Tout le décor est `aria-hidden` et `pointer-events: none`.
- Les sections n'ont **aucun fond plein** : elles sont transparentes sur le ciel.
- Un texte posé sur une scène reçoit un voile (`linear-gradient(to top, night-950/90 → transparent)`).

### D.2 Fond vivant

C'est P1, plus les règles d'heure de chaque page.

| Page | Ouverture | Corps | Fin |
|---|---|---|---|
| Accueil, sous-pages | `minuit` | `nuit`, puis `bleue` | `aube` (aube de fin de page et pied de page) |
| /panne-autoroute | `bleue` | `bleue` | `aube` |
| /demande | `nuit` | `nuit` | `aube` à l'étape « Demande reçue » (soulagement) |
| Pages légales | `nuit` | `nuit` | pied de page `aube` |

Entre deux pages, le ciel repart de `minuit` en 900 ms : la nuit retombe.

### D.3 Progression et fil conducteur

**Ordinateur (≥ 1 024 px) : `RoadLine`.**
- Une ligne de route fixe à gauche (`left: max(8px, calc((100vw - 1280px) / 2 - 32px))`) : tirets craie à 8 %.
- Le remplissage jaune suit la position (`scaleY`, `animation-timeline: scroll(root)`, repli dans le runtime). Une petite borne losange jaune marque l'extrémité.
- Un repère par section (prop `markers`) : ce sont des liens d'ancre qui fonctionnent sans JavaScript (doux avec Lenis). L'étiquette (« PK 03 · Le prix ») apparaît au survol et au focus. Le repère actif porte `aria-current`.

**Mobile et tablette (< 1 024 px) :** une ligne de 2 px en bas de l'en-tête. Le remplissage jaune (`scaleX`) suit le défilement (`scroll(root)`, sinon repli en JavaScript dans l'en-tête). Rien d'autre.

**/demande :** `StepRoad` remplace les deux (la ligne de l'en-tête est masquée par `body:has([data-page="demande"])`).

### D.4 Transitions de page (React `ViewTransition`, Next 16.3)

D'après `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` :

**Mise en place :**
- **Une enveloppe dans chaque `page.tsx`**, pas dans le layout : un layout persiste, donc ses animations d'entrée et de sortie ne se déclenchent pas.
- Elle s'écrit `<PageTransition>`, ce qui donne `<ViewTransition enter="page-in" exit="page-out" default="none"><div class="page">{children}</div></ViewTransition>`. Le `div` unique garantit une seule capture.

**Le reste du site n'est jamais capturé**, et reste donc vivant et cliquable :

```css
:root { view-transition-name: none; }
::view-transition {
  pointer-events: none;
  /* l'incrustation ne recouvre jamais l'en-tête ni la barre d'action */
  clip-path: inset(var(--vt-top) 0 var(--vt-bottom) 0);
}
:root { --vt-top: var(--header-h, 4rem); --vt-bottom: 0px; }
@media (max-width: 767px) { :root { --vt-bottom: var(--actionbar-h); } } /* 3.5rem + .625rem + max(.75rem, safe-area) */
```

- L'en-tête écrit `--header-h` grâce à un `ResizeObserver` (l'annonce peut prendre deux lignes).
- **Aucun `viewTransitionName`** sur l'en-tête, la barre d'action, Appeler, WhatsApp ni sur un bouton. Le guide précise que les éléments nommés ne reçoivent plus les clics pendant la transition.

**« Allumage des phares » :**
- l'ancienne page s'éteint en 140 ms (`opacity: 0`, −12 px, `--ease-accel`) ;
- la nouvelle apparaît dans un cercle de lumière qui s'ouvre depuis le point touché : `clip-path: circle(0 at var(--vt-x) var(--vt-y))` vers `circle(150vmax …)`, en 360 ms (`--ease-out-expo`) ;
- **durée totale : 400 ms au plus** ;
- en niveau `lite` : simple fondu de 150 ms.

**Morph partagé** (`<SharedMorph name>`, soit `<ViewTransition name share="morph" default="none">`) :
- seulement entre les quatre panneaux du carrefour de l'accueil et la plaque d'ouverture de la page d'arrivée :
  - `vt-sign-depannage` ;
  - `vt-sign-remorquage` ;
  - `vt-sign-autoroute` ;
  - `vt-sign-demande` (vers la route des étapes de /demande) ;
- **un seul élément par nom et par page** ;
- 380 ms, avec un léger flou au milieu (`via-blur`) ;
- si la page d'arrivée n'est pas préchargée, l'entrée normale prend le relais.

**`off` et préférence système :** `::view-transition-*` passent à `animation: none` (plus la règle du guide sur `prefers-reduced-motion`).

**Navigateur sans prise en charge :** navigation normale.

**Liens `tel:` et WhatsApp :** jamais de transition.

**Test :** pendant une navigation, à t + 100 ms, `elementFromPoint` au centre de chaque lien de la barre d'action renvoie bien ce lien (voir L9).

### D.5 En-tête « pare-brise »

**Dimensions et fond :**
- 64 px sur mobile, 80 px à partir de `lg` (comme aujourd'hui ; `scroll-padding-top: 5rem` est conservé) ;
- transparent en haut de page ;
- après 24 px de défilement : sur mobile, fond plein `night-950/96` **sans flou** ; sur ordinateur, `night-950/80` avec un flou de 14 px ; reflet d'un pixel en haut.

**Contenu :**
- **Logo :** un reflet traverse le losange une fois, au chargement (CSS).
- **Navigation à partir de `lg` :** Dépannage · Remorquage · Autoroute · Zones · Questions · Contact.
  - Texte de 0,875rem en graisse 700.
  - Page active : petit losange jaune et soulignement de 2 px en jaune.
  - Survol : le soulignement s'étire (`scaleX`, 220 ms).
- **À droite :** `CallLink` (« Appeler » entre 1 024 et 1 279 px, le numéro en chiffres fixes à partir de 1 280 px, ou rien si le numéro n'est pas réglé), puis le bouton jaune « Demander un dépannage ». Tout en `whitespace-nowrap`.
- **Annonce de l'administration :** bande au-dessus de l'en-tête, texte `led` sur `night-950`, statique, sans masque à points (taille inférieure à 20 px), sur deux lignes si besoin.

**Comportement :** **jamais masqué au défilement.**

### D.6 Menu mobile « plan de nuit »

- **Conservé en `<details data-menu>` :** il fonctionne sans JavaScript.
- **Bouton :** 44 × 44 px, libellé accessible « Ouvrir le menu » ou « Fermer le menu ».
- **Panneau :** fixe sous l'en-tête, jusqu'en bas de l'écran. La barre d'action (z 60) reste visible par-dessus, et le panneau garde un espace pour elle en bas. Le défilement de la page est bloqué en CSS (`body:has(details[data-menu][open]) { overflow: hidden }`).
- **Liens (`MENU_ITEMS`)** : titre en `font-sign` de 1,5rem et une ligne d'aide en `text-small` `asphalt-200`.

  | Lien | Ligne d'aide |
  |---|---|
  | Accueil | « Votre situation, votre prix » |
  | Dépannage | « Batterie, crevaison, petite panne » |
  | Remorquage | « Accident, véhicule non roulant, parking » |
  | Panne sur autoroute | « Sécurité d'abord, puis relais à la sortie » |
  | Zones d'intervention | « Paris et toute l'Île-de-France » |
  | Questions fréquentes | « Prix, paiement, véhicules, photos » |
  | L'entreprise | « Qui nous sommes, notre dépanneuse » |
  | Contact | « Téléphone, WhatsApp, adresse » |

- **En bas :** « Demander un dépannage » (jaune), puis une rangée Appeler / WhatsApp.
- **Ouverture :** un cercle de lumière part du bouton (`clip-path: circle()`, 320 ms, CSS), puis les lignes apparaissent avec une cascade de 30 ms (8 px).
- **Fermeture :** instantanée, aussi par Échap (JavaScript) et à la navigation (logique existante).
- **`off` :** sans animation.

### D.7 Barre d'action mobile

- **Logique inchangée :** trois liens rendus par le serveur (`ActionBar` existant), qui fonctionnent sans JavaScript et même quand la base est en panne. Le cas « N° à compléter » est conservé.
- **Ajouts :**
  - `data-action="call|whatsapp|request"` ;
  - sur /demande, `body:has([data-page="demande"]) [data-action="request"] { display: none }`, et la grille passe à deux colonnes. CSS pur.
- **Apparence :** fond `night-950/94`, liseré supérieur de 1 px en `led` à 50 %. Retour au toucher `scale(.98)` en 120 ms.
- **Interdits :**
  - toute animation automatique ou pulsation ;
  - masquer la barre ;
  - nommer la barre pour une transition ;
  - y mettre un champ de formulaire.
- **Superposition :** z 60, `contain: layout paint`.
- **/panne-autoroute :** la barre reste identique (c'est le contrat global). La consigne « borne orange ou 112 d'abord » est en tête de page (F.4).

### D.8 Fins de page : Prochaine sortie, puis Aube, puis Retour au dépôt

**`NextExit`, la « Prochaine sortie » :**
- un grand panneau de direction pleine largeur : « Prochaine sortie » (plaque), le titre de la page suivante en `font-sign`, une ligne d'aide et une flèche ;
- une traînée de reflet au survol ;
- l'enchaînement est défini dans `NEXT_EXIT` :

  | De | Vers | Ligne d'aide |
  |---|---|---|
  | /depannage | Remorquage | « Votre véhicule, où vous voulez » |
  | /remorquage | Panne sur autoroute | « Votre sécurité d'abord » |
  | /panne-autoroute | Zones d'intervention | « Paris et toute l'Île-de-France » |
  | /zones-d-intervention | Questions fréquentes | « Prix, paiement, véhicules » |
  | /questions-frequentes | L'entreprise | « RNB AUTO, dépannage à Bobigny » |
  | /entreprise | Contact | « On vous répond tout de suite » |

  Pas de « Prochaine sortie » sur l'accueil (le carrefour joue ce rôle), /contact, /demande, les pages légales ni la 404.

**`DawnCta`, l'aube** (remplace `CtaBand` et `FinalCta`) :
- section `data-sky="aube"` ;
- bande d'aube **locale** sous le texte (violet, puis rose, puis or, sur les 30 % du bas, sans texte dessus) ;
- titre propre à la page en `text-dawn`, en jaune, avec `data-beam="view"` ;
- texte ;
- `ActionRow` : « Demander un dépannage », numéro de téléphone, WhatsApp. **Visibles dès l'entrée de la section**, jamais conditionnés à une animation ;
- scène : route en perspective avec `GroundText` (« ON ARRIVE » sur l'accueil, aucun texte peint ailleurs) et dépanneuse qui arrive et freine (P16) ;
- `calm` (/panne-autoroute) : ni dépanneuse ni texte peint.

**`SiteFooter`, « Retour au dépôt » :**
- Rangée de chevrons statique.
- **Bande d'horizon** (40svh au plus, 220 px au moins) :
  - horizon de ville en couche lointaine, statique, sur une aube locale ;
  - le soleil monte avec le défilement (`view()`) ;
  - la dépanneuse **vide**, en miroir, revient vers le dépôt, à droite (P16, 2 s). Une fois garée, gyrophare et phares s'éteignent (images clés avec délai), et le rideau descend (1 s).
- **Légende**, au-dessus de la bande, sur le violet : « Retour au dépôt · {depotLabel} ». C'est le troisième trajet.
- **Grand « RNB AUTO »** en contour (`aria-hidden`) : un remplissage doré monte une fois (`clip-path: inset(100% 0 0 0)` vers `inset(0)`, 1,2 s, `data-inview`).
- **Colonnes de liens** (`FOOTER_COLUMNS`, contenu existant, lien « Espace RNB AUTO » compris).
- **Bloc contact :** téléphone, WhatsApp, `depotLabel`, `serviceArea`, email. « À COMPLÉTER » pour le téléphone et l'email s'ils manquent.
- **Bouton** `MotionToggle`.
- **Mention existante :** « Les prix affichés en ligne sont des estimations, confirmées avant chaque intervention. » (aucune occurrence de « prix estimé » dans le pied de page ; voir G.1).
- **Fond sous l'horizon :** `night-900`.
- **Sans JavaScript et en `off` :** état final (dépanneuse garée, rideau fermé, « RNB AUTO » doré).

### D.9 Pointeur, curseur, son

- Curseur natif partout.
- Sur ordinateur : un seul halo (P21).
- Boutons principaux sur ordinateur : reflet rétroréfléchissant au survol et `translateY(-2px)`. Pas de magnétisme.
- **Aucun son, jamais :** ni fichier audio ni API audio.

### D.10 Logique du site : ce qui change

1. **Accueil :** situation, puis processus, puis prix, puis sécurité, puis zone, puis questions, puis action. La personne est orientée dès le deuxième écran.
2. **Sous-pages :** une page répond à une question. Ordre commun : ouverture (titre et bouton visibles d'emblée), réponse, comment ça se passe, prix, questions liées, prochaine sortie, aube, dépôt.
3. **Un seul bouton jaune plein par écran.** Appeler et WhatsApp restent toujours accessibles : barre mobile, en-tête sur ordinateur, menu, aube, pied de page, /contact.
4. **Questions :** une source unique (`src/content/faq.ts`, 11 questions existantes, mot pour mot, avec un thème et un identifiant d'ancre). Elle sert à l'accueil, à la page des questions, aux « questions liées » et aux données structurées. Aucune question inventée.
5. **Dépôt :** le libellé, la ville et la position viennent toujours des réglages (`info.depot`).
6. **Disponibilité :** affichée (avec le point vert) seulement si elle est réglée. Sinon, rien.
7. **Code couleur :** bleu = autoroute (donc jamais RNB AUTO), orange = urgence, sécurité et intervention, vert = WhatsApp, jaune = action et votre véhicule.

---

## E. Storyboard de l'accueil

### E.0 Vue d'ensemble

| # | `id` | PK | Section | `data-sky` | Ordinateur 1 440 × 900 | Mobile 390 × 844 |
|---|---|---|---|---|---|---|
| 0 | `ouverture` | — | Besoin d'un dépannage ? | minuit | 100 vh | 100svh |
| 1 | `portique` | — | Panneau à messages | minuit | 30 vh | ≈ 26svh |
| 2 | `carrefour` | 01 | Où en êtes-vous ? | minuit | 100 vh | ≈ 110svh |
| 3 | `comment-ca-marche` | 02 | De la panne à la solution | nuit | ≈ 360 vh (carte collante) | ≈ 230svh (mini-cartes) |
| 4 | `prix` | 03 | Le prix avant le départ | nuit | ≈ 120 vh | ≈ 135svh |
| 5 | `autoroute` | 04 | Sur l'autoroute ? | bleue | ≈ 130 vh | ≈ 135svh |
| 6 | `zone` | 05 | Basés à Bobigny | bleue | ≈ 110 vh | ≈ 120svh |
| 7 | `questions` | 06 | Vos questions | bleue | ≈ 90 vh | ≈ 100svh |
| 8 | `on-arrive` | 07 | On arrive. | aube | 100 vh | ≈ 105svh |
| — | (pied de page) | — | Retour au dépôt | aube | ≈ 110 vh | ≈ 135svh |

**Total :** environ 12,5 écrans sur ordinateur, sans aucun épinglage ; environ 12 écrans sur mobile.

**Repères `RoadLine` :** 01 à 07.

Le bandeau défilant, la grille de cartes de services, la section claire et la maquette de téléphone disparaissent.

### E.1 Ouverture (le décor apprécié, conservé et enrichi)

**Contenu :**
- **Pastille :** `info.availability` avec un point vert pulsé si elle est réglée. Sinon `{info.depot.city} · Île-de-France` avec une épingle et sans point vert, ou « Île-de-France » si la ville est inconnue.
- **Titre principal :** « Besoin d'un » / « dépannage ? », la deuxième ligne en jaune dans `<em data-beam="load">`. Plus de `RiseWords`.
- **Accroche (existante) :**
  - mobile : « Remorquage et assistance en Île-de-France. **Votre prix estimé en moins d'une minute**, confirmé avant l'intervention. » ;
  - à partir de `sm` : « Remorquage et assistance à {info.serviceArea}. … ».
- **Boutons :** `PrimaryLink` « Demander un dépannage » (64 px), plus `CallLink` « Appeler » et `WhatsAppLink` à partir de `md`.
- **Réassurance** entre `sm` et `lg` : les trois puces existantes.
- Indice « Défiler » sur ordinateur, et `ScenePause` dans le coin bas droit de la scène.

**Scène** (`aria-hidden`, `id="scene-ouverture"`, `data-pause-offscreen`, `data-scene="hero-brake"`) :
- `Skyline` lointaine (boucle de 140 s) et proche (70 s), lampadaires (11 s) avec cônes, flaques et reflets mouillés ;
- route mouillée avec ses tirets (`road-x`, 0,5 s, existant) ;
- dépanneuse `TowTruck moving headlights beacon` qui entre (`truck-in`, 1,6 s, existant), avec le reflet du gyrophare sur la chaussée ;
- **nouveau :** la voiture du client sur l'accotement, à droite (`CarSide hazards`), feux de détresse à 1 Hz et leurs reflets ;
- le halo du gyrophare devient un dégradé radial.

**Au chargement** (CSS seul, rien de bloquant) :
- **t = 0 :** texte et boutons déjà là ;
- **de 0,2 à 1,1 s :** le faisceau passe sur « dépannage ? » ;
- **de 0 à 1,6 s :** la dépanneuse entre.

**Au défilement, le freinage** (scène `hero-brake`, GSAP et ScrollTrigger, `scrub: 0.6` sur ordinateur et `scrub: true` sur mobile, **sans épinglage**). De 0 à 100 % de la sortie de l'ouverture :
1. La vitesse des boucles (route, lampadaires, villes, roues) passe de 1 à 0 (`Animation.playbackRate`, courbe `power2.out`).
2. La dépanneuse avance de 8 vw (ordinateur) ou 18 vw (mobile) et s'arrête juste derrière la voiture en warnings. À 85 %, le nez plonge de −1,2° puis la caisse reprend sa place.
3. Le bloc de texte monte (`yPercent: -16`) et s'estompe jusqu'à 0,15 (comportement existant).
4. À la fin, seuls les feux de détresse et le gyrophare restent animés : les deux lumières se répondent.

**Ordinateur 1 440 :** le texte occupe la gauche (720 px au plus). La scène est en bas (38 vh). Le centre de la dépanneuse est à environ 62 % de la largeur, la voiture à environ 90 %.

**Mobile 390** (iPhone avec barres Safari, environ 664 px utiles) :

| Hauteur (px) | Élément |
|---|---|
| 0 à 64 | En-tête |
| ≈ 96 | Pastille |
| 120 à 245 | Titre sur deux lignes (66 px) |
| jusqu'à ≈ 345 | Accroche sur trois lignes |
| ≈ 375 à 440 | Bouton jaune pleine largeur, 64 px |
| ≈ 460 et plus | Scène (220 px au moins), arrière de la voiture visible au bord droit |
| bas de l'écran | Barre d'action |

**Le bas du bouton est sous 600 px, même sans JavaScript.**

**`off` :** image fixe : dépanneuse arrêtée derrière la voiture, phares et feux de détresse allumés, halo fixe, « dépannage ? » éclairé.

**Sans JavaScript :** boucles CSS, sans freinage.

### E.2 Portique (remplace le bandeau défilant)

- `<section aria-label="Informations RNB AUTO">` sans titre.
- Un portique en SVG (poutre en treillis, deux poteaux) enjambe la route, qui prolonge celle de l'ouverture (bande de bitume de 24 px avec ses tirets).
- **`Pmv`, liste fermée de messages :**
  1. « PRIX ESTIMÉ EN MOINS D'UNE MINUTE »
  2. « CONFIRMÉ PAR TÉLÉPHONE AVANT LE DÉPART »
  3. « DÉPANNAGE SUR PLACE OU REMORQUAGE »
  4. « DÉPART DE {VILLE DU DÉPÔT} · PARIS · ÎLE-DE-FRANCE » (sans la ville si elle est inconnue)
  5. « APPEL · WHATSAPP · EN LIGNE »
  6. `info.availability` en capitales, **seulement si elle est réglée**
- **Ordinateur :** une ligne LED.
- **Mobile :** deux lignes. Les messages longs sont fournis en deux parties (par exemple `["CONFIRMÉ PAR TÉLÉPHONE", "AVANT LE DÉPART"]`).
- **`off` et sans JavaScript :** premier message.

### E.3 Carrefour « Où en êtes-vous ? » (PK 01)

**Contenu :**
- plaque « PK 01 · Votre situation » ;
- titre de section « Où en êtes-vous ? » (`data-split`) ;
- quatre `DirectionSign` :

| Flèche | Titre | Ligne d'aide | Lien | Ton | Morph |
|---|---|---|---|---|---|
| ← | Dépannage sur place | Batterie, crevaison, petite panne | /depannage | `night` | `vt-sign-depannage` |
| ↑ | Remorquage | Accident, véhicule non roulant, parking | /remorquage | `night` | `vt-sign-remorquage` |
| ↗ | Sur l'autoroute ? | Votre sécurité d'abord, puis le relais à la sortie | /panne-autoroute | `beacon` | `vt-sign-autoroute` |
| → | Mon prix maintenant | Estimation en moins d'une minute | /demande | `signal` (le seul panneau jaune) | `vt-sign-demande` |

- **En dessous :** « Plus rapide : appelez-nous » suivi de `CallLink` (numéro). Sinon `WhatsAppLink` « Écrire sur WhatsApp ». Sinon rien.

**Ordinateur :**
- grille de 2 × 2 panneaux (environ 560 × 140 px) ;
- derrière, la ligne médiane descend du portique et se divise en quatre branches (`RoutePaths` en mode `view`, 900 ms, cascade de 90 ms) ;
- chaque panneau reçoit un reflet au passage (P6), et au survol (flèche + 8 px).

**Mobile :** quatre panneaux pleine largeur de 80 px au moins. La ligne court à gauche et se ramifie vers chaque panneau ; elle se dessine une fois.

**`off` :** tout est tracé et statique.

### E.4 « De la panne à la solution, sans stress. » (PK 02, titre existant)

**Contenu :**
- les quatre étapes existantes, mot pour mot :
  1. « Vous nous dites où vous êtes »
  2. « Vous voyez le prix tout de suite »
  3. « La dépanneuse arrive »
  4. « Votre véhicule part où vous voulez »
- dans le texte de l'étape 3, « Bobigny » vient de `info.depot.city` ;
- légende : « ① Aller · ② Transport · ③ Retour : les trois trajets de la dépanneuse sont pris en compte dans le prix. » ;
- interrupteur (deux boutons radio, CSS `:has`, fonctionne sans JavaScript) : « Remorquage » / « Réparé sur place ». En mode « Réparé sur place », le tronçon ② disparaît, le retour part du point « Vous », et une ligne s'affiche : « Réparé sur place : pas de transport, seulement l'aller et le retour de la dépanneuse. »

**Ordinateur :** scène collante (P9).
- La carte est collante à droite (100 vh) : `PlanIdf variant="depot"` avec les rues stylisées, le canal et le dépôt.
- Les textes défilent à gauche (4 × 80 vh).
- **Entrée :** plan grue (P8, de 60° à 0° pendant les 40 premiers vh).
- **Temps (`data-beat`) :**
  1. L'épingle « Vous » tombe, warnings allumés (`--ease-out-back`).
  2. L'étiquette « Prix estimé · en 1 minute » se déplie.
  3. Le tronçon ① se dessine, et la dépanneuse vue de dessus le suit avec son cône de phares.
  4. Le tronçon ② se dessine en jaune avec le drapeau, puis le tronçon ③ (retour en pointillé), puis la légende s'imprime.
- Les points sont illustratifs et cohérents avec l'exemple du moteur : environ 6 km jusqu'au client, puis environ 10 km de transport. Aucun nom de rue.

**Mobile : rien de collant** (corrige le chevauchement actuel).
- Chaque étape a sa mini-carte 16:10 : le même `<symbol>` recadré par `viewBox`, avec le tronçon de l'étape.
- Puis la borne numérotée, le titre et le texte.
- Le tronçon se dessine à l'entrée (900 ms, une fois). La première mini-carte porte le plan grue (55°).
- Puis viennent la légende et l'interrupteur.

**`off` et sans JavaScript :** tracés complets, dépanneuse au drapeau.

### E.5 « Le prix avant le départ. » (PK 03, `id="prix"`)

**Colonne de gauche :**
- texte existant (« Notre calculateur tient compte de votre position… ») ;
- trois garanties existantes en plaques compactes avec pictogramme :
  - estimation en moins d'une minute, sur votre téléphone ;
  - prix confirmé par téléphone avant l'intervention ;
  - distance réelle calculée sur les routes, pas à vol d'oiseau ;
- `PrimaryLink` « Calculer mon prix ».

**Colonne de droite (dessous sur mobile) :**
- **Fenêtre de rue** (scène de 16:9, 180 px de haut sur mobile) : rue, trois lampadaires, dépanneuse.
- **Interrupteur « Quand ? »** (client, seulement si des exemples existent) : « En journée » | « La nuit » | « Le dimanche ». Trois boutons segmentés de 48 px.
- **`EstimateTicket` (exemple) :**
  - en-tête losange « RNB AUTO · ESTIMATION » ;
  - tampon « EXEMPLE » ;
  - total « Total estimé TTC » avec `Odometer` ;
  - lignes = libellés renvoyés par le moteur (`includedLabels`), **sans montant** ;
  - pied : « Confirmé par téléphone avant le départ. Exemple calculé avec nos tarifs actuels : citadine en panne à {approachKm} km du dépôt, remorquée sur {loadedKm} km, {moment}. Votre prix exact en moins d'une minute. »
- **Impression** à l'entrée (900 ms), compteur en 1,1 s.

**Quand on change le moment :**
- le compteur roule de l'ancien au nouveau prix (700 ms) ;
- la fenêtre de rue suit `--daylight` (de 1 à 0 pour « La nuit ») : le ciel s'assombrit, les lampadaires s'allument un à un (cascade de 80 ms), puis les phares ;
- la ligne de majoration apparaît si le moteur la renvoie (libellé seul).

**Données : `getHomePriceExamples()`** (serveur, lot L1). Trois appels à `computeQuote` avec la dernière version des tarifs :
- **journée :** `HOME_EXAMPLE_SCENARIO` ;
- **nuit :** même scénario, à l'heure `start` de la première règle active de catégorie `time_slot` (condition `time_between`) ; option masquée s'il n'y en a pas ;
- **dimanche :** `isoWeekday: 7`, à l'heure du scénario ;
- les libellés suivent `estimate.showSupplementLabels` ;
- le texte « {moment} » est généré : « un mardi après-midi », « un mardi à {start} », « un dimanche après-midi » ;
- `site.showExamplePrice` désactivé ou erreur : `null`.

**Sans exemple :** le ticket affiche « Votre prix en moins d'une minute » et le bouton, sans interrupteur.

**`off` :** changement instantané.

**Sans JavaScript :** exemple « En journée » seulement, interrupteur masqué.

### E.6 « Sur l'autoroute ? Votre sécurité d'abord. » (PK 04, `data-sky="bleue"`)

- **Pastille orange :** « Panne sur autoroute ».
- **Titre :** **statique** (pas de `data-split` : aucune animation avant une consigne de sécurité).
- **Paragraphe existant :** jamais animé.
- **Quatre réflexes existants :** `InfoPlaque` numérotées, ton `beacon`, **sans apparition**.
- **`HighwayRelay`** (mode `scrub` sur ordinateur, `view` une fois sur mobile). Légendes : « Sur l'autoroute : le dépanneur agréé » · « À la sortie » · « RNB AUTO prend le relais ».
  - Le dépanneur agréé est une silhouette grise, neutre et étiquetée.
  - La dépanneuse RNB AUTO n'apparaît **qu'après le panneau bleu « SORTIE »**.
- **Liens :** « Que faire en cas de panne sur autoroute » (/panne-autoroute) ; « Votre véhicule est sorti ? Demander le relais » (`/demande?autoroute=1`).
- **Mobile :** texte, réflexes, schéma vertical (autoroute en haut, sortie, rue en bas), liens.
- **`off` :** schéma complet fixe.

### E.7 « Basés à Bobigny. Partout en Île-de-France. » (PK 05, titre existant)

- **Texte existant :** « Notre dépanneuse part de {depotLabel}… Votre distance exacte est calculée dès que vous indiquez votre position. »
- **Mention :** « Plan schématique. » ;
- **Lien :** « Voir les zones desservies ».
- **`PlanIdf variant="region" sweep`** :
  - le gyrophare du dépôt balaie (un tour en 5 s) ;
  - chaque ville s'éclaire au passage du faisceau : opacité 1 puis 0,75, grâce à un `animation-delay` calculé côté serveur à partir de l'angle de la ville ;
  - à l'entrée, les villes apparaissent une à une (cascade de 40 ms).
- **Puces de départements** (texte) : 93 · 75 · 92 · 94 · 95 · 77 · 78 · 91.
- **Ordinateur :** texte à gauche, plan carré de 560 px. **Mobile :** texte, plan pleine largeur, puces.
- **`off` :** villes allumées, sans balayage.

### E.8 « Vos questions, nos réponses. » (PK 06)

- `FaqAccordion` avec les quatre questions marquées `home` ;
- lien « Toutes les questions » ;
- section calme : aucun décor animé.

### E.9 « On arrive. » (PK 07)

- **`DawnCta` :**
  - titre « On arrive. » ;
  - texte existant : « Décrivez votre situation en moins d'une minute. Nous vous rappelons pour confirmer et la dépanneuse part. » ;
  - boutons visibles dès l'entrée ;
  - « ON ARRIVE » peint sur la chaussée ;
  - dépanneuse **chargée** qui arrive et freine.
- **Mobile :** titre sur deux lignes, boutons empilés de 64 px, scène de 38svh en dessous.
- Le pied de page « Retour au dépôt » (D.8) suit.

---

## F. Storyboards des sous-pages

**Squelette commun des pages de service :**
1. `OpeningShot` : plaque « PK 00 · … », titre principal, accroche, bouton principal, scène propre à la page.
   - Sur mobile, titre et bouton dans le premier écran (bas du bouton sous 580 px à 390 × 664), scène de 34svh au plus.
   - Sur ordinateur, 88 vh au plus.
2. Sections construites avec les objets de B.8.
3. `RelatedFaq`.
4. `NextExit`.
5. `DawnCta`.
6. Pied de page.

Toutes les pages ont `<PageTransition>`, un seul titre principal et `data-sky` sur chaque section. Les textes existants sont repris mot pour mot.

### F.1 /depannage : « Le bas-côté »

- **PK 00 · Ouverture (minuit)**
  - Plaque « Dépannage sur place » avec pictogramme `wrench`.
  - Titre « On vous remet <em data-beam="load">sur la route.</em> ».
  - Accroche existante.
  - Bouton « Estimer mon dépannage ».
  - Morph `vt-sign-depannage`.
  - **Scène :**
    - sous le cône d'un lampadaire au sodium, la voiture capot ouvert, warnings allumés (`CarSide hoodOpen hazards`) ;
    - la dépanneuse garée derrière, gyrophare allumé ;
    - les câbles de démarrage tendus entre les deux (trait jaune) ;
    - un petit témoin de charge se remplit une fois (1,2 s).
- **PK 01 · « Ce que nous réglons sur place » (nuit), le tableau de bord**
  - `VoyantGroup` de six voyants, chacun avec son texte existant **toujours visible** : Batterie à plat · Crevaison (témoin de pression des pneus) · Petite panne (témoin moteur) · Véhicule en parking (P) · Accès difficile · Autre problème (?).
  - **Ordinateur :** arc de compteur décoratif dont l'aiguille balaie une fois, voyants en 3 × 2.
  - **Mobile :** liste d'une colonne (voyant de 56 px, titre, texte).
  - La mise du contact (P15) joue à l'entrée.
- **PK 02 · « Quatre étapes, aucune surprise » (nuit)**
  - Route avec quatre bornes (textes existants de `Steps`).
  - **Ordinateur :** route horizontale ; la dépanneuse vue de dessus va de borne en borne (`RoutePaths scrub`).
  - **Mobile :** route verticale à gauche ; le remplissage jaune suit le défilement (`view()` sur `scaleY`) ; chaque borne s'allume (P6).
- **PK 03 · « Si la réparation n'est pas possible sur place » (bleue)**
  - Texte existant.
  - `LoadingSequence` (`scrub` sur ordinateur, `once` sur mobile) : le plateau s'incline, le câble se tend, la voiture monte, le plateau revient à plat.
- **Questions liées :** `prix-sur-place`, `presence`, `sans-site`.
- **Prochaine sortie :** Remorquage.
- **Aube :** « Besoin d'une dépanneuse maintenant ? » (dépanneuse vide).

### F.2 /remorquage : « Le chargement »

- **PK 00 · Ouverture (minuit)**
  - Plaque « Remorquage » avec pictogramme `truck`.
  - Titre « Votre véhicule, <em data-beam="load">où vous voulez.</em> ».
  - Accroche existante.
  - Bouton « Estimer mon remorquage ».
  - Morph `vt-sign-remorquage`.
  - **Scène `LoadingSequence`** (dépanneuse de profil, plateau incliné, voiture au pied de la rampe) :
    - **ordinateur :** liée aux 60 premiers vh de défilement (la voiture monte au treuil, le plateau revient à plat, les phares s'allument) ;
    - **mobile :** jouée une fois, 400 ms après le chargement (2,6 s), décorative.
- **PK 01 · « Roulant, non roulant, accidenté » (nuit), scène collante (P9)**
  - **Ordinateur :** grande illustration du plateau collante à droite. Les six situations existantes défilent à gauche, et l'illustration change à chaque temps :
    - « Véhicule non roulant » : cale, roues marquées en `brake` ;
    - « Après un accident » : avant enfoncé ;
    - « Roues bloquées » : roue marquée ;
    - « Parking et sous-sol » : barre de hauteur au-dessus ;
    - « Vers votre garage » : porte de garage à destination ;
    - « Chez vous » : maison.
  - **Mobile :** rien de collant ; chaque situation a sa vignette de 64 px, puis son titre et son texte.
- **PK 02 · « Quel véhicule transportons-nous ? » (nuit)**
  - Portique de gabarit (barre de hauteur à chevrons).
  - Les silhouettes du **catalogue en base** (`VehicleIcon`) passent dessous, chacune avec un badge :
    - « Prix en ligne » : contour craie et coche, **pas de vert** ;
    - « Sur demande » : contour `signal` et pictogramme de téléphone.
  - **Ordinateur :** la rangée glisse sous le portique (`translateX` en `view()`, sans épinglage).
  - **Mobile :** liste verticale ; chaque silhouette glisse de 24 px à l'entrée.
  - Le texte existant sur les véhicules « sur demande » suit.
- **PK 03 · « Comment est calculé le prix ? » (bleue)**
  - Textes existants.
  - `ThreeLegs mode="tow" draw="view"`.
  - Puces « Véhicule · Situation · Horaire » qui s'allument.
  - Les trois garanties existantes.
  - Bouton « Calculer mon prix ».
- **Questions liées :** `emmener`, `vehicules`, `calcul-prix`.
- **Prochaine sortie :** Panne sur autoroute.
- **Aube :** « Un véhicule à déplacer ? » (dépanneuse chargée).

### F.3 /zones-d-intervention : « Vue du ciel »

- **PK 00 · Ouverture (minuit), disposition `stacked`**
  - Ordre : texte d'abord sur mobile, puis la carte.
  - Plaque « Zones d'intervention ».
  - Titre « Depuis Bobigny, <em data-beam="load">toute l'Île-de-France.</em> » (existant).
  - Accroche existante, avec `depotLabel`.
  - Bouton « Calculer mon prix ».
  - Scène : `PlanIdf region sweep` en grand (60svh sur mobile, 80 vh sur ordinateur) avec un lent recul (`scale` de 1,12 à 1 sur 2,4 s, une fois). Voile sombre sous le texte sur ordinateur.
- **PK 01 · « Votre commune ? » (nuit)**
  - `CommuneSearch` (client, aucun appel réseau) : filtre sans tenir compte des accents ni des majuscules sur les listes existantes.
  - Commune trouvée : « Oui, nous intervenons à {commune}. » et « Calculer mon prix → ».
  - Commune absente : « Pas dans la liste ? Envoyez quand même votre demande : nous vous rappelons avec un prix précis. »
  - Masqué sans JavaScript (`html:not(.js)`) ; les listes complètes restent visibles en dessous.
- **PK 02 · « Où intervenons-nous ? » (nuit)**
  - Les quatre blocs existants (93, Paris, petite couronne, grande couronne) en plaques avec leurs puces de communes.
  - **Ordinateur :** plan collant à droite ; chaque bloc allume sa zone :
    - 93 : halo autour du dépôt ;
    - Paris : anneau intérieur ;
    - petite couronne : anneau moyen ;
    - grande couronne : anneau extérieur.
  - **Mobile :** pas de plan collant ; une petite vignette d'anneau par bloc (`<use>` du symbole du plan).
- **PK 03 · Paragraphe existant** « Plus loin, ou sur un trajet long ? … » (bleue).
- **Questions liées :** `position`, `autoroute`.
- **Prochaine sortie :** Questions fréquentes.
- **Aube :** « Une panne en Île-de-France ? ».

### F.4 /panne-autoroute : « La bande d'arrêt d'urgence » (intensité minimale)

**Règles de la page :** ni montée de lignes, ni apparition sur le contenu de sécurité, ni gyrophare, ni halo, ni texte peint. Seuls les feux de détresse (1 Hz) clignotent et le relais se trace une fois. Aucun GSAP.

- **PK 00 · Ouverture (`data-sky="bleue"`)**
  - Plaque orange « Panne sur autoroute ».
  - Titre « Votre sécurité <em>d'abord.</em> » (statique).
  - Accroche : `info.regulatedRoads.message` (réglage).
  - **Pas de bouton RNB AUTO en tête.**
  - **Juste sous l'accroche, dans le premier écran mobile :** les quatre réflexes existants, numérotés en grand et immobiles. Le réflexe 4 contient le lien « Appeler le 112 » (`tel:112`, **à faire valider**, voir G.4).
  - Puis le lien secondaire « Votre véhicule est déjà sorti ? Demander le relais » (`/demande?autoroute=1`).
  - **Ordinateur :** réflexes à gauche, scène à droite :
    - véhicule en warnings sur la bande d'arrêt d'urgence ;
    - pictogramme des passagers derrière la glissière ;
    - borne orange ;
    - panneau bleu générique (sans numéro) ;
    - traînées de feux lointaines, statiques.
- **PK 01 · « Le dépanneur agréé, puis RNB AUTO » (bleue)**
  - `HighwayRelay draw="view"`.
  - Trois `InfoPlaque` (textes existants : « Sur l'autoroute », « À la sortie », « RNB AUTO prend le relais »).
- **PK 02 · Encadré existant** « Votre véhicule est sorti de l'autoroute ? », avec le bouton « Demander le relais ».
- **Questions liées :** `autoroute`, `prix-definitif`.
- **Prochaine sortie :** Zones d'intervention.
- **Aube (`calm`) :** « Besoin d'un relais après l'autoroute ? ».

### F.5 /questions-frequentes : « La route en point d'interrogation »

- **PK 00 · Ouverture (minuit)**
  - Plaque « Questions fréquentes ».
  - Titre « Vos questions, <em data-beam="load">nos réponses.</em> ».
  - Accroche existante.
  - **Scène :** une route vue de dessus en forme de « ? » ; le point du « ? » est le losange du dépôt. Une dépanneuse vue de dessus parcourt la route **une fois** (6 s, CSS `offset-path` sur un élément HTML posé sur une scène de taille fixe) puis se gare au dépôt.
  - **`off` :** dépanneuse au dépôt.
- **Barre de thèmes collante** (sous l'en-tête) : Prix · Intervention · Autoroute · Véhicules · Photos et position.
  - Liens d'ancre qui fonctionnent sans JavaScript, avec `data-follow-section` (thème actif souligné).
  - Pas de filtre animé.
- **Un groupe par thème :**
  - titre de section (`data-split`) ;
  - `FaqAccordion` avec ancres (un `id` par question) ;
  - `faq-hash.tsx` (client) ouvre la question désignée par l'adresse (au chargement et quand l'ancre change) et la fait briller une fois.
- **Données structurées FAQPage :** générées depuis `FAQ`.
- **Prochaine sortie :** L'entreprise.
- **Aube :** « Une autre question ? ».

### F.6 /entreprise : « Le dépôt, avant le départ »

- **PK 00 · Ouverture (minuit)**
  - Plaque « L'entreprise ».
  - Titre « RNB AUTO, <em data-beam="load">dépannage à Bobigny.</em> ».
  - Accroche existante.
  - Bouton « Demander un dépannage ».
  - **Scène :** façade du dépôt la nuit, enseigne losange allumée, rideau qui monte une fois (1,2 s) ; la dépanneuse fait deux appels de phares.
- **PK 01 · « Un plateau prêt à partir » (nuit)**
  - Cadre « plan technique » (`blueprint`, quadrillage) avec `TowTruck variant="blueprint"`.
  - Trois lignes de cote se dessinent à l'entrée (`view`) vers des annotations **reprises des textes existants** :
    - « Plateau : le chargement sur plateau protège votre véhicule pendant le transport, qu'il roule ou non. »
    - « Départ : {depotLabel} »
    - « Un interlocuteur direct : la personne qui vous rappelle organise l'intervention. »
  - **Aucune dimension, aucune caractéristique.**
- **PK 02 · « Ce sur quoi vous pouvez compter » (bleue)** : les six engagements existants en grandes lignes (`text-step`), chacun avec un pictogramme dans un rond et un reflet (P6).
- **Interdits :** personnes, historique, chiffres.
- **Prochaine sortie :** Contact.
- **Aube :** « Besoin d'une dépanneuse maintenant ? ».

### F.7 /contact : « La borne d'appel » (sans GSAP)

- **Titre :** « On vous répond <em>tout de suite.</em> » (sans faisceau). Accroche existante.
- **Immédiatement après, sans aucune animation d'entrée :** trois grandes rangées de 88 px au moins.

  | Canal | Contenu | Si absent |
  |---|---|---|
  | Téléphone | Numéro en `font-figure` (2,5rem), lien `tel:`, ondes radio CSS autour de l'**icône** (le numéro n'est jamais animé) | `ToComplete` « numéro de téléphone » |
  | WhatsApp | « Écrire sur WhatsApp » + « Pratique pour nous envoyer des photos du véhicule. » | `ToComplete` « numéro WhatsApp » |
  | Demande en ligne | « Faire une demande » + « Votre prix estimé en moins d'une minute. » | — |

- **Puis :**
  - **Adresse :** `depotLabel`, mini `PlanIdf variant="depot"` de 280 px, statique, et « Voir sur la carte » (lien existant).
  - **Email :** ou `ToComplete`, avec « Pour les demandes non urgentes. ».
  - **Disponibilité :** seulement si elle est réglée (le réglage dit « Laissez vide pour ne rien afficher »).
- Ni aube ni « Prochaine sortie ». Le test e2e « À COMPLÉTER » reste valide.

### F.8 /demande : habillage seulement

**Logique conservée à l'identique :**
- étapes et branche autoroute ;
- `estimateAction` et `submitRequestAction` ;
- validations et schémas ;
- `sessionStorage` (`rnb-demande-v1`) et `popstate` ;
- photos, consentement, champ piège et limites.

**Cadre :**
- `data-page="demande"` sur la racine du parcours ;
- ciel `nuit` ;
- ni GSAP, ni Lenis, ni halo, ni `RoadLine`.

**`RequestBackdrop` :** route en perspective (point de fuite) à 20 % d'opacité, statique. Les tirets avancent de 400 ms à chaque changement d'étape, et tournent lentement **seulement pendant le calcul** (`data-computing`).

**`<noscript>`** en tête de `page.tsx` : « Le calcul en ligne a besoin de JavaScript. Appelez-nous ou écrivez-nous sur WhatsApp. », avec les liens.

**Composants :**

- **`StepRoad`** (remplace les six segments) :
  - six bornes : Lieu · Destination · Véhicule · Problème · Prix · Coordonnées ;
  - remplissage jaune jusqu'à la borne courante ;
  - mini-dépanneuse vue de dessus qui avance (`transform`, 400 ms, `--ease-out-expo`) ;
  - après le choix du véhicule, sa silhouette (`VehicleIcon`) se pose sur le plateau ;
  - « Étape x sur 6 » et « Retour » conservés ;
  - cible du morph `vt-sign-demande`.
- **`RouteSheet`** (« feuille de route ») :
  - **ordinateur :** colonne collante à droite. Lignes Prise en charge, Destination, Véhicule, Problème, Prix, seulement quand elles sont remplies. Chaque ligne est un bouton qui appelle le `goTo(step)` existant ;
  - **mobile :** barre de 44 px **non collante** sous `StepRoad` (« {ville} → {destination ou Sur place} · {véhicule} · {problème} »), qui se déplie (`aria-expanded`) ;
  - absente à l'étape « Lieu » et à l'étape « envoyée ».
- **Changement d'étape :**
  - la classe `animate-fade-up` (l. 278) devient `data-dir="forward|back"` : glissement de 24 px depuis la droite ou la gauche, avec fondu, en 220 ms ;
  - le sens est un état d'interface séparé, posé dans `goTo`. **`FlowState` n'est pas modifié** ;
  - `off` : sans mouvement.
- **Focus :** après `goTo`, le titre de l'étape (`tabIndex={-1}`) reçoit le focus avec `preventScroll`, dans le `requestAnimationFrame` existant.

**Étape par étape :**

- **Lieu :**
  - pendant « Localisation en cours… », des ondes de sonar partent du bouton (CSS) ;
  - en cas de réussite, une épingle tombe avec ses warnings près du champ ;
  - le « Position trouvée » passe du vert au jaune ;
  - question autoroute : **libellés exacts « Non », « Oui », « Je ne sais pas »** ; les pictogrammes sont `aria-hidden` (petit panneau bleu sur « Oui »).
- **Autoroute :** encadré orange inchangé, sans animation. Ajout du lien « Appeler le 112 » (à valider).
- **Destination :** tuiles inchangées, petit tracé de l'épingle au drapeau au-dessus du champ.
- **Véhicule :** tuiles avec silhouettes ; reflet sur la tuile choisie ; on passe immédiatement à l'étape suivante (logique existante).
- **Problème :**
  - les tuiles deviennent des voyants (`PROBLEM_VOYANTS`), **libellés inchangés** ;
  - le choix allume le voyant (P15, 220 ms) ;
  - question « Le véhicule peut-il rouler ? » et case « parking » inchangées.
- **Calcul :**
  - mini `PlanIdf` avec les **vrais points** (dépôt reçu en prop, `pickup` et `dropoff` s'ils ont une position) ;
  - `ThreeLegs mode="loop"` ;
  - texte inchangé : « Nous calculons le trajet réel de la dépanneuse. » ;
  - **au-delà de 4 s :** « Toujours en cours… Vous pouvez aussi nous appeler. », avec Appeler et WhatsApp ;
  - aucun délai artificiel.
- **Prix :**
  - `EstimateTicket` (direct) : « Prix estimé » (**seule occurrence de la page**) + `Odometer` (au montage, 700 ms) + « TTC · confirmé par téléphone avant l'intervention » ;
  - lignes de kilomètres (`vehicleTripKm`, `approachKm`) et `includedLabels` ;
  - impression au montage en 450 ms, prix en haut ;
  - boutons inchangés, **actifs immédiatement** ;
  - la branche « On vous rappelle avec un prix » ne change pas.
- **Coordonnées :**
  - champs de 56 px, libellés au-dessus (existant) ;
  - récapitulatif présenté en feuille de route (mêmes données, mêmes boutons « Modifier ») ;
  - case de consentement inchangée (c'est la **dernière case à cocher de la page**).
- **Envoyée :**
  - « Demande reçue ! » inchangé ;
  - référence inchangée : texte statique, avec un seul reflet sur son conteneur ;
  - un balayage unique de gyrophare (conique, 1,2 s) derrière la pastille ;
  - section `data-sky="aube"` ;
  - ticket avec le tampon « REÇUE » si un prix existe ;
  - `PhotoUploader frame="viewfinder"` (coins de cadrage) ;
  - « En attendant » inchangé.
- **Barre d'action :** Appeler et WhatsApp seulement (D.7).

### F.9 Pages légales : « L'entrée d'agglomération »

- **Ouverture compacte (40svh au plus) :** plaque craie stylisée « entrée d'agglomération » (liseré `asphalt-950`, **sans le rouge réglementaire**), titre principal en noir condensé. Pictogramme selon la page : document, cadenas ou contrat.
- **Sommaire** (`LegalShell`, liste explicite `{ id, label }` par page) :
  - collant à gauche sur ordinateur ;
  - `<details>` « Sommaire » en tête sur mobile ;
  - chaque titre de section reçoit un `id`.
- **Corps :** colonne de 68 caractères ; `Prose` (socle). `content-visibility: auto; contain-intrinsic-size: auto 800px` sur les longues sections.
- **« À COMPLÉTER » :** style chantier (`ToComplete` du socle, bordure à chevrons orange et noire), impossible à manquer.
- **/conditions-d-intervention :** bloc « L'essentiel » en quatre plaques, avec des **phrases reprises du texte existant** :
  - estimation et prix confirmé ;
  - prix confirmé avant l'intervention ;
  - supplément toujours expliqué avant ;
  - moyens de paiement indiqués lors de la confirmation.
- **/confidentialite :** durées de conservation en puces (valeurs existantes, `PHOTO_LIMITS`).
- **Mouvement :** aucune animation sur le texte. Seuls la progression de lecture (`RoadLine` sans repères) et le sommaire actif.
- **Fin :** petite plaque « fin » barrée (décor) et lien « Retour à l'accueil ».

### F.10 404 « Route barrée » et page d'erreur

- **`not-found.tsx`** (serveur ; lit `getPublicSiteInfo()` pour le numéro) :
  - **Scène :**
    - barrière à chevrons jaunes et noirs avec deux feux orange (1 Hz au plus) ;
    - lampadaire qui « respire » (`.lamp-breathe`) ;
    - dépanneuse qui arrive et freine devant la barrière (P16) ;
    - panneau jaune « DÉVIATION ».
  - **Texte :** titre « Cette page est <em>en panne.</em> » et texte existants.
  - **Actions :** `PrimaryLink` « Demander un dépannage », lien « Retour à l'accueil », `CallLink` si le numéro est réglé.
- **`error.tsx`** (client) :
  - même décor, lampadaire éteint, sans dépanneuse ;
  - textes existants (« Petite panne technique », « Réessayer », « Accueil »), avec la phrase sur les boutons Appeler et WhatsApp de la barre.
- **`off` :** statique.

---

## G. Garde-fous : urgence, performance, accessibilité (règles vérifiables)

### G.1 Urgence

| # | Règle | Vérification |
|---|---|---|
| U1 | Sur chaque page publique, le HTML rendu par le serveur contient la barre d'action : Appeler (`tel:`, ou /contact « N° à compléter »), WhatsApp et Demande (sauf sur /demande). | Test sans JavaScript (L9) |
| U2 | Aucun lien `tel:`, `wa.me` ou `/demande`, ni aucun bouton, ne porte `data-reveal`, ne se trouve dans un `[data-reveal]`, ni ne reçoit d'animation d'entrée ou de délai. | Test DOM (sélecteur vide) et opacité calculée à 1 |
| U3 | Titre principal, accroche et bouton principal : opacité calculée à 1 et `transform: none` dès `DOMContentLoaded`, sur chaque page. Présents sans JavaScript. | Test |
| U4 | À 390 × 664 sans JavaScript, le bas du bouton principal est sous 600 px sur l'accueil et sous 580 px sur les pages qui ont un bouton d'ouverture. Sur /panne-autoroute, le premier réflexe commence avant 664 px. Barre d'action visible. | Test |
| U5 | Aucun `pin:` GSAP dans `src/`. Pas de Lenis sur écran tactile ni sur /demande. Pas de ScrollSmoother. | `grep` et revue |
| U6 | Barre d'action au-dessus de tout : `elementFromPoint` au centre de chaque lien de la barre renvoie ce lien. Vérifié à 5 positions de défilement par page, et à t + 100 ms d'une navigation. | Test |
| U7 | Ni écran de chargement, ni introduction, ni « cliquer pour entrer », ni son. | Revue |
| U8 | /demande : aucune attente artificielle. Appeler et WhatsApp visibles pendant le calcul. Message au bout de 4 s. Prix dans le texte et `aria-live` dès la réception. Boutons actifs immédiatement. | e2e |
| U9 | Transition de page de 400 ms au plus. Aucun `viewTransitionName` sur l'en-tête, la barre d'action, Appeler, WhatsApp ou un bouton. Incrustation découpée hors des bandes de l'en-tête et de la barre. | `grep` et test U6 |
| U10 | GSAP et Lenis sont importés dynamiquement, jamais au chargement initial. Si leur chargement échoue (requêtes bloquées), la page est complète et rien n'est caché. | Trace de performance et test avec requêtes bloquées |
| U11 | Clignotement à 1 Hz au plus, sur des surfaces de moins de 25 % de l'écran. Gyrophare en pulsation douce. Aucun flash plein écran. | Revue |

**Textes protégés par `tests/e2e/parcours.spec.ts`** (à ne jamais casser) :
- **Accueil :** un seul titre de niveau 1 (pied de page et aube compris).
- **/contact :** « À COMPLÉTER » visible tant que le numéro n'est pas réglé.
- **/demande :**
  - champs « Adresse où se trouve le véhicule » et « Destination du véhicule » ;
  - boutons « Non » (correspondance exacte, unique), « Continuer » (aucun autre bouton ne doit contenir ce mot), `/Berline/`, `/Panne mécanique/`, `/Voir le prix/`, `/Demander le dépannage/`, `/Envoyer ma demande/` ;
  - textes de saisie « Votre nom » et « 06 12 34 56 78 » ;
  - **le texte « prix estimé », dans toutes les casses, présent dans un seul élément de tout le document** à l'étape prix (menu fermé, pied de page et listes `sr-only` compris : le mode strict de Playwright compte aussi les éléments cachés) ;
  - `/\d+\s?€/` visible ;
  - « Demande reçue » unique ;
  - `/RNB-\d{4}-\d{5}/` unique (donc **pas de compteur ni de doublon sur la référence**) ;
  - `input[type=checkbox]` : la dernière case de la page est le consentement. **Aucune case à cocher dans l'en-tête, le pied de page, le menu ou la barre** (le bouton d'animations est un `<button>`).

### G.2 Performance (budget)

**JavaScript par page :**

| Page | Chemin critique (en plus de Next et React) | Chargé en différé |
|---|---|---|
| Accueil | Runtime ≤ 4 Ko, `Pmv` ≤ 1,5 Ko, choix du moment ≤ 1,5 Ko | gsap 27,6 + ScrollTrigger 17,5 + SplitText 3,5 = **48,6 Ko** ; Lenis 5,3 Ko (ordinateur) ; scènes ≤ 2 Ko chacune |
| /depannage, /remorquage, /zones-d-intervention, /entreprise, /questions-frequentes | Runtime ≤ 4 Ko (+ recherche de commune ≤ 1,5 Ko) | 48,6 Ko + Lenis 5,3 Ko (ordinateur) + `LoadingSequence` ≤ 2 Ko |
| /panne-autoroute | Runtime | **0 Ko de GSAP**, Lenis seulement sur ordinateur |
| /contact, pages légales, 404, erreur | Runtime | 0 |
| /demande | Runtime + parcours existant | 0 (ni GSAP, ni Lenis) |

**Autres budgets :**

| Mesure | Cible |
|---|---|
| HTML de l'accueil, compressé, en production | ≤ 40 Ko, mesuré avec la compression du serveur de production (brotli sur Vercel ; zstd ou gzip derrière Caddy, voir `docs/08`, section 3). `next start` seul compresse en gzip au niveau par défaut, plus lourd. |
| Nœuds DOM de l'accueil | ≤ 1 500 |
| Nœuds SVG par scène | ≤ 400 |
| CSS total compressé | ≤ 35 Ko |
| Images matricielles | `grain.png` ≤ 6 Ko ; horizons en SVG statiques ≤ 8 Ko chacun, en cache |
| Polices | Inchangées (Archivo variable, latin, repli métrique par défaut) |
| Lighthouse mobile (4G lente, processeur ×4) | LCP ≤ 2,0 s (le titre principal, du texte), TBT ≤ 150 ms, CLS ≤ 0,02 |
| Mesure terrain | INP ≤ 150 ms |
| Lien d'appel utilisable | < 1 s après le premier affichage |

**Rendu :**
- seulement les propriétés de C.1-7 ;
- `will-change` posé pendant l'animation, puis retiré ;
- `backdrop-filter` seulement pour l'en-tête sur ordinateur, le menu et la barre d'action ;
- aucun `filter: blur` sur mobile ;
- boucles en pause hors de l'écran ;
- `ScrollTrigger.refresh()` après le chargement des polices ;
- `content-visibility` seulement sur les pages légales, jamais sur une section suivie par ScrollTrigger.

### G.3 Accessibilité

| # | Règle | Vérification |
|---|---|---|
| A1 | Un seul titre de niveau 1 par page, un titre de niveau 2 par section. La partie « PK 0X · » des plaques est `aria-hidden`. | Test |
| A2 | Tout SVG décoratif est `aria-hidden`. L'information des scènes existe aussi en texte. | Revue |
| A3 | En niveau `off` : aucune animation infinie en cours après 1 s (`document.getAnimations()`), aucune animation liée au défilement (`animation: none` explicite sur `[data-beam]`, `[data-retro]::after`, `[data-parallax]`, `[data-tilt-cam]`, `[data-ground]`), aucune animation de transition de page. | Test |
| A4 | WCAG 2.2.2 : bouton « Pause » sur la scène de l'ouverture et sur le panneau à messages, plus le bouton global du pied de page. | Revue |
| A5 | Contrastes de B.2, vérifiés automatiquement (`src/styles/contrast.test.ts` lit les jetons de `globals.css`). Pas de texte en `asphalt-400` sur le ciel. | Test unitaire |
| A6 | Focus visible (contour jaune existant de 3 px) sur les panneaux, repères et bascules. Ordre du clavier = ordre visuel. Échap ferme le menu. | Revue et test |
| A7 | Zones de toucher de 48 px au moins, actions principales de 56 à 64 px. Texte de 17 px au moins sur mobile. | Captures |
| A8 | Compteur et ticket : la vraie valeur est dans le texte, immédiatement. `aria-live` seulement pour l'étape et le prix de /demande (existant). | e2e |
| A9 | En couleurs forcées : décor masqué, faisceau désactivé. Avec `prefers-contrast: more` : ni grain ni voile, bordures pleines. | Revue |
| A10 | SplitText avec `aria: "auto"`. Aucun ScrambleText. | `grep` |

### G.4 Contenu : rien d'inventé

- **Faits utilisables :**
  - dépôt (réglage) ;
  - Paris et Île-de-France ;
  - prix estimé en moins d'une minute, confirmé par téléphone avant le départ ;
  - trois trajets ;
  - dépannage sur place ou remorquage sur plateau ;
  - relais après l'autoroute ;
  - photos possibles ;
  - appel, WhatsApp, en ligne ;
  - exemple de prix calculé par le moteur, avec le tampon « EXEMPLE ».
- **Interdits :**
  - heure affichée, « disponible maintenant », délai d'arrivée ;
  - avis, chiffres, années d'expérience ;
  - personnes ou dirigeants ;
  - caractéristiques de la dépanneuse ;
  - distance « à vol d'oiseau » ;
  - dépanneuse RNB AUTO sur une voie d'autoroute.
- **Textes nouveaux :** seulement ceux qui figurent dans E et F. Le reste est repris mot pour mot de l'existant.
- **Points à faire valider par RNB AUTO :**
  1. lien `tel:112` sur /panne-autoroute et dans la branche autoroute de /demande (textes de sécurité à relire, docs/07 D) ;
  2. texte existant « Nous vous rappelons dans quelques minutes » de l'étape « Demande reçue » (engagement de délai, docs/07 C) ; il n'est pas modifié ;
  3. le treuil, déjà mentionné sur /remorquage (type de dépanneuse, docs/07 B) ; il n'est pas ajouté ailleurs ;
  4. photos réelles de la dépanneuse (docs/07 A) : aucun emplacement vide tant qu'elles n'existent pas.

---

## H. Plan de construction pour des agents en parallèle

### H.0 Règles communes à tous les agents

1. **Lire avant de commencer :** `CLAUDE.md`, ce cahier, `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`.
2. **Périmètre :** ne modifier **que** les fichiers de son lot. Si un besoin touche le socle, le signaler dans le compte rendu, sans modifier le socle.
3. **Styles propres :** un `*.module.css` à côté du composant (animations dont les noms sont locaux au module). Les couleurs passent toujours par un jeton (`var(--color-…)` ou une classe Tailwind). Pas de `@apply` sans `@reference "@/app/globals.css"`.
4. **Interdits :** `rounded-3xl` sur des blocs de contenu, `blur-*`, `pin:` GSAP, import depuis `src/components/home/*` (sauf L1), section en fond plein, nouvelle couleur.
5. **Chaque page :**
   - contenu dans `<PageTransition>` ;
   - un seul titre de niveau 1 ;
   - `data-sky` sur chaque section ;
   - `<RoadLine markers>` en dehors de l'enveloppe (sauf /demande) ;
   - `RelatedFaq`, `NextExit` et `DawnCta` selon la partie F ;
   - CSS des scènes collantes sans `overflow: hidden` sur leurs ancêtres.
6. **Composants partagés avec `/admin`** (`ui/icon.tsx`, `request/address-input.tsx`, `request/photo-uploader.tsx`, `brand/vehicle-icon.tsx`, `brand/logo.tsx`) : modifications **additives** uniquement. Le rendu de l'administration doit rester identique (captures avant et après de `/admin/tester` et `/admin/parametres`).
7. **Validation :**
   - `npm run check` au vert ;
   - `npm run e2e` au vert, obligatoire pour L7 et L9, recommandé pour tous ;
   - planches de captures : `node scripts/review-shots.mjs <route>`, puis la même commande avec `--reduced`, à 390 × 844 et 1 440 × 900 ;
   - zéro débordement horizontal et zéro erreur de console.
8. **Langue :** commentaires en français, identifiants en anglais. Respecter les règles ESLint `react-hooks` (pas de `setState` synchrone dans un effet, pas de lecture de `ref` pendant le rendu).

**Pièges connus :**
- **`animation-timeline` après `animation` :** le raccourci `animation` remet `animation-timeline` à sa valeur par défaut.
- **Ciel fixe :** hauteur en `100lvh` (iOS).
- **Identifiants SVG :** uniques par page (prop `id`).
- **Noms de transition :** uniques par page.
- **Titre principal :** jamais de `data-split`.
- **Faisceau :** jamais combiné à `data-split`.
- **Tests de Playwright en mode strict :** textes en double (G.1).

### H.1 S1 : Fondations (premier, seul)

**Fichiers à créer :**

| Fichier | Contenu ou API publique |
|---|---|
| `docs/09-refonte-immersive.md` | Ce cahier, mot pour mot |
| `src/styles/motion.css` | Propriétés enregistrées (`--sky-*`, `--city-glow`, `--stars`, `--draw`), jetons de durée, images clés et états de P1 à P8, P10, P12, P14 à P17, P20, `.motion-ready`, règles `html[data-motion="off"]` et `@media (prefers-reduced-motion)`, blocs `@supports (animation-timeline: view())` |
| `src/styles/view-transitions.css` | Règles de D.4 (`:root { view-transition-name: none }`, découpe, `page-in`, `page-out`, `morph`, `off`) |
| `src/styles/contrast.test.ts` | Lit `globals.css` et vérifie les paires de B.2 (seuils A5) |
| `src/content/faq.ts` (+ `faq.test.ts`) | `type FaqTheme = "prix" \| "intervention" \| "autoroute" \| "vehicules" \| "photos-position"` ; `type FaqItem = { id: string; q: string; a: string; theme: FaqTheme; home?: true }` ; `FAQ` (11 questions existantes mot pour mot) ; `FAQ_THEMES` ; `faqItems(ids: readonly string[]): FaqItem[]` ; `HOME_FAQ_IDS`. Le test vérifie des identifiants uniques et des textes identiques à l'existant. |
| `src/content/site-map.ts` | `type NavItem = { href: string; label: string; help: string }` ; `NAV_DESKTOP` ; `MENU_ITEMS` (D.6) ; `FOOTER_COLUMNS` (contenu existant) ; `NEXT_EXIT: Record<string, { href: string; title: string; text: string }>` (D.8) ; `CALM_ROUTES` |
| `src/components/motion/types.ts` | Types de C.4 |
| `src/components/motion/level.ts` (+ `level.test.ts`) | `MOTION_STORAGE_KEY = "rnb-motion"` ; `type MotionEnv = { stored: string \| null; reducedMotion: boolean; saveData: boolean; deviceMemory: number \| null; cores: number \| null }` ; `detectMotionLevel(env): MotionLevel` ; `MOTION_BOOT_SCRIPT: string`. Le test exécute la chaîne du script dans un environnement simulé et vérifie qu'elle donne le même résultat. |
| `src/components/motion/motion-head-script.tsx` | `MotionHeadScript(): ReactElement` (balise `<script>` en ligne) |
| `src/components/motion/motion-runtime.tsx` (client) | `MotionRuntime(): null` (C.4) |
| `src/components/motion/runtime/observers.ts` | Apparitions, `data-inview`, pause hors écran, ciel, `data-follow-section` |
| `src/components/motion/runtime/gsap-kit.ts` | `loadGsapKit(): Promise<GsapKit>` (mis en cache, enregistrement une seule fois) |
| `src/components/motion/runtime/helpers.ts` | `createSceneHelpers(): SceneHelpers` ; `initSplit(root, kit)`, `initStages(root, kit, desktop)`, `initRoutes(root, kit, ctx)` : chacun retourne une fonction de nettoyage |
| `src/components/motion/runtime/lenis.ts` | `startLenis(kit \| null): () => void` |
| `src/components/motion/runtime/scene-registry.ts` | `registerScenes(loaders): () => void` ; `subscribe(fn)` ; `getLoader(name)` |
| `src/components/motion/runtime/transition-origin.ts` | Écriture de `--vt-x` et `--vt-y` |
| `src/components/motion/runtime/halo.ts` | P21 |
| `src/components/motion/use-scenes.ts` (client) | `useScenes(loaders: SceneLoaders): void` |
| `src/components/motion/page-transition.tsx` | `PageTransition({ children })` ; `SharedMorph({ name, children })` où `name` est de la forme `` `vt-sign-${string}` `` |
| `src/components/motion/odometer.tsx` (client) | `Odometer({ value: number; unit?: "€" \| "km" \| null; trigger?: "view" \| "mount"; duration?: number; className?: string })`. Rend `<span data-odometer><span class="odometer-value">{texte formaté}</span></span>`. |
| `src/components/motion/pmv.tsx` (+ `pmv.module.css`, client) | `type PmvMessage = string \| readonly [string, string]` ; `Pmv({ messages: PmvMessage[]; label: string; size?: "md" \| "lg"; interval?: number; className?: string })` |
| `src/components/motion/motion-toggle.tsx` (client) | `MotionToggle({ className?: string })` : bouton `aria-pressed` qui envoie l'événement `rnb:motion-change` |
| `src/components/motion/scene-pause.tsx` (client) | `ScenePause({ targetId: string; className?: string })` |
| `src/components/motion/night-sky.tsx` | `NightSky(): ReactElement` (dégradé, étoiles, grain, halo) |
| `src/components/scenes/base/skyline.tsx` | `Skyline({ layer: "far" \| "near"; loop?: "slow" \| "fast" \| null; className?: string })`. Image de fond `/scenes/skyline-*.svg`, répétée en `repeat-x`, déplacée en `transform`. |
| `src/components/scenes/base/street-lamps.tsx` | `StreetLamps({ count?: number; reflection?: boolean; loop?: boolean; className?: string })` |
| `src/components/scenes/base/depot.tsx` | `Depot({ shutter?: "open" \| "closed"; animate?: "open" \| "close" \| null; signLit?: boolean; className?: string })` |
| `src/components/scenes/base/base.module.css` | Styles de ces trois composants |
| `public/scenes/skyline-far.svg`, `public/scenes/skyline-near.svg` | Une seule `path` par couche, fenêtres en une seule `path`, 8 Ko au plus chacun |
| `public/textures/grain.png` | 128 px, 6 Ko au plus |
| `scripts/generate-scene-assets.ts` | Générateur déterministe (reprend `seeded()` de `night-road.tsx`, et `zlib` de Node pour le PNG). Commande : `npx tsx scripts/generate-scene-assets.ts`. |
| `scripts/review-shots.mjs` | Outil de captures versionné, repris de `.review-shots.mjs` (dossier de sortie en argument) |

**Fichiers à modifier :**

| Fichier | Changement |
|---|---|
| `src/app/globals.css` | Jetons de B.1 et B.3 (`--text-*` avec leur `--line-height`), courbes de C.2, utilitaires `font-sign`, `font-plate`, `font-step`, `font-figure`, `font-led`, `led-mask`, `grain` (remplace `asphalt-grain`, gardé en alias jusqu'à L9), `plaque` ; `@import "../styles/motion.css"` et `@import "../styles/view-transitions.css"`. `.theme-admin` inchangé. |
| `src/components/brand/tow-truck.tsx` | Props **additives** : `bed?: "flat" \| "tilted"`, `cable?: boolean`, `mirrored?: boolean`, `variant?: "illustration" \| "blueprint"`, `parts?: boolean` (pose `data-part="body\|bed\|car\|cable\|cab\|wheels\|beacon\|headlights"` pour les scènes). Les props existantes et leur rendu sont inchangés. |
| `src/server/site/public-info.ts` | `PublicSiteInfo` reçoit `depot: { label: string; city: string \| null; lat: number \| null; lng: number \| null }` (depuis `company.depot`), et `examplePrice` devient `{ priceTtcCents: number; includedLabels: string[] } \| null` (`clientIncludedLabels(result, values["estimate.showSupplementLabels"])`). `depotLabel` et `HOME_EXAMPLE_DESCRIPTION` sont conservés. |

**Critères d'acceptation :**
- `npm run check` au vert, avec les nouveaux tests (niveau, contrastes, FAQ) ;
- aucune page modifiée ;
- `npx tsx scripts/generate-scene-assets.ts` régénère des fichiers identiques octet pour octet ;
- horizon proche ≤ 8 Ko, horizon lointain ≤ 8 Ko, grain ≤ 6 Ko.

### H.2 S2a : Coque (après S1, en parallèle de S2b)

**Fichiers possédés :**

| Fichier | Contenu ou API publique |
|---|---|
| `src/app/(public)/layout.tsx` (modifié) | Structure de D.1 |
| `src/components/public/site-header.tsx` (réécrit, client) | `SiteHeader({ phone, whatsapp, announcement })` (D.5) ; ligne de progression mobile ; `ResizeObserver` qui écrit `--header-h` |
| `src/components/public/mobile-menu.tsx` (nouveau) | `MobileMenu({ phone, whatsapp })` (D.6) |
| `src/components/public/action-bar.tsx` (modifié) | Même API ; `data-action`, règles `:has`, apparence de D.7 |
| `src/components/public/site-footer.tsx` (réécrit) | `SiteFooter({ info })` (D.8). Utilise `Skyline`, `Depot`, `TowTruck mirrored` (S1) et `MotionToggle`. |
| `src/components/public/actions.tsx` (nouveau) | `PrimaryLink({ href, children, size?: "lg" \| "md", transitionTypes?: string[], className? })` ; `CallLink({ phone, variant?: "solid" \| "outline" \| "ghost", label?: "number" \| "short", className? })` (repli « N° à compléter » vers /contact) ; `WhatsAppLink({ whatsapp, message?, variant?, className? })` ; `ActionRow({ info, primary?: { href: string; label: string } \| null, layout?: "row" \| "stack", tone?: "night" \| "dawn" })` |
| `src/components/public/page-blocks.tsx` (réécrit) | `OpeningShot({ pk?, eyebrow, pictogram?, title, lead?, actions?, scene?, sky?, layout?: "split" \| "stacked" \| "compact", morphName?, id? })` ; `Section({ id, pk, label, sky?, title?, split?: boolean, intro?, width?: "default" \| "wide" \| "reading", children, className? })` ; `Plate({ pk?, children, tone?: "signal" \| "beacon" \| "chalk" })` ; `NextExit({ from })` ; `DawnCta({ info, title, text?, truck?: "loaded" \| "empty" \| "none", ground?: string \| null, calm?: boolean })` ; `RelatedFaq({ ids, title? })` ; `Prose` et `ToComplete` (même API, nouveau style). **`PageHero`, `FeatureGrid`, `Steps` et `CtaBand` restent exportés et marqués `@deprecated`** jusqu'à L9. |
| `src/components/public/faq-accordion.tsx` (nouveau) | `FaqAccordion({ items: FaqItem[], anchors?: boolean })` (P18) |
| `src/components/public/road-line.tsx` (nouveau) | `RoadLine({ markers?: { id: string; pk: string; label: string }[] })` (D.3) |
| `src/components/public/ground-text.tsx` (nouveau) | `GroundText({ text })` (P17) |
| `src/components/public/shell.module.css`, `blocks.module.css` (nouveaux) | Styles de la coque |
| `src/components/public/page-motion.tsx` | **Supprimé** (remplacé par `MotionRuntime`) |

**Critères d'acceptation (captures) :**
1. Sur toutes les pages existantes, encore avec leurs anciens blocs : ciel visible, en-tête et pied de page refaits, barre d'action intacte. `npm run e2e` au vert.
2. En-tête à 1 440 : numéro et bouton sur une seule ligne. À 1 100 : « Appeler ». Transparent en haut, opaque après défilement. Ligne de progression sur mobile.
3. Menu ouvert à 390 : huit lignes avec leur aide, bouton jaune, Appeler et WhatsApp, barre d'action visible par-dessus. Fonctionne sans JavaScript.
4. Pied de page : dépanneuse garée et rideau fermé en `--reduced`, légende « Retour au dépôt · 145 rue de Paris, 93000 Bobigny », aucune case à cocher.
5. Test manuel de transition : en naviguant, l'en-tête et la barre d'action ne clignotent jamais.

### H.3 S2b : Kit d'illustrations (après S1, en parallèle de S2a)

**Fichiers possédés** (tous dans `src/components/scenes/kit/`, sauf `icon.tsx`) :

| Fichier | API publique |
|---|---|
| `car-side.tsx` | `CarSide({ id: string; hazards?: boolean; hoodOpen?: boolean; className?: string })` |
| `glyphs.tsx` | `TruckTopGlyph({ headlights?, loaded? })`, `CarTopGlyph({ hazards? })`, `PinGlyph({ label?, hazards? })`, `FlagGlyph()`, `DepotGlyph({ pulse? })` : des groupes `<g>` centrés sur 0,0, à placer dans un `<svg>` |
| `route-paths.tsx` | `type RouteLeg = { key: string; d: string; style: "aller" \| "transport" \| "retour" \| "agree" }` ; `RoutePaths({ legs, mode: "scrub" \| "view" \| "loop" \| "static", truck?: "top" \| null, idPrefix: string, scrubStart?: string, scrubEnd?: string })`. Fragment SVG conforme au contrat P10. |
| `plan-idf/geo.ts` | Repères géographiques publics : villes (les 15 de `sections.tsx` plus Bobigny), points de la Seine, de la Marne et du canal de l'Ourcq (tableau ci-dessous) |
| `plan-idf/projection.ts` (+ `projection.test.ts`) | `projectIdf(lat, lng, variant: "region" \| "depot", center?: { lat; lng }): { x: number; y: number }`. Variante `region` : centre Paris (48.8530, 2.3499), compression radiale en racine carrée jusqu'à 60 km, angle conservé. Variante `depot` : linéaire, rayon de 12 km autour du dépôt. |
| `plan-idf/plan-idf.tsx` | `PlanIdf({ depot: PublicSiteInfo["depot"]; variant?: "region" \| "depot"; sweep?: boolean; highlight?: "paris" \| "petite-couronne" \| "grande-couronne" \| "93" \| null; labels?: "major" \| "all" \| "none"; points?: { kind: "vous" \| "destination"; lat: number; lng: number }[]; children?: ReactNode; symbolId?: string; className?: string })`. Position du dépôt : `depot.lat/lng`, sinon la ville `depot.city` trouvée dans `geo.ts`, sinon pas de marqueur. Anneaux schématiques (Paris, petite couronne, grande couronne), sans aucune mention de kilomètres. Mention « Plan schématique » rendue en texte par l'appelant. |
| `direction-sign.tsx` | `DirectionSign({ href, title, subtitle?, arrow: "left" \| "up" \| "up-right" \| "right" \| "down", pictogram: IconName, tone?: "night" \| "signal" \| "beacon", morphName?, transitionTypes?, className? })` |
| `info-plaque.tsx` | `InfoPlaque({ number?, pictogram?, title, children, tone?: "night" \| "beacon" \| "motorway", className? })` |
| `voyant.tsx` | `type VoyantGlyph = "battery" \| "tpms" \| "engine" \| "parking" \| "access" \| "question" \| "accident" \| "wheel-lock" \| "hook"` ; `VoyantGroup({ children, className? })` ; `Voyant({ glyph, label, tone?: "amber" \| "red", lit?: boolean, size?: number })` ; `PROBLEM_VOYANTS: Record<string, VoyantGlyph>` (codes `battery`, `flat_tire`, `breakdown`, `accident`, `locked_wheels`, `other`) |
| `estimate-ticket.tsx` | `EstimateTicket({ priceCents: number \| null; priceLabel?: string; lines: string[]; stamp?: "exemple" \| "recue" \| null; footnote?: ReactNode; print?: "view" \| "mount" \| "none"; odometer?: "view" \| "mount" \| "none"; emptyText?: string; children?: ReactNode; className?: string })`. Prix en haut. Le libellé du total est fourni par l'appelant : « Prix estimé » sur /demande, « Total estimé TTC » sur l'accueil. |
| `three-legs.tsx` | `ThreeLegs({ mode?: "tow" \| "on_site"; km?: { aller: number \| null; transport: number \| null } \| null; draw?: "view" \| "scrub" \| "loop" \| "static"; compact?: boolean })`. Le retour n'affiche jamais de kilomètres. |
| `highway-relay.tsx` | `HighwayRelay({ draw?: "scrub" \| "view" \| "static"; captions?: boolean; orientation?: "auto" \| "horizontal" \| "vertical" })` |
| `loading-sequence.tsx` + `loading-sequence.scene.ts` | `LoadingSequence({ id, mode?: "scrub" \| "once", className? })` avec `data-scene="loading-sequence"` ; le module exporte par défaut un `SceneModule` (`needsGsap: true` en mode `scrub`, `helpers.tween` en mode `once`) |
| `kit.module.css` | Styles du kit |
| `src/components/ui/icon.tsx` (ajouts seulement) | `hazard`, `vest`, `guardrail`, `callbox`, `cone`, `barrier`, `heightBar`, `booster`, `ticket`, `losange`, `gauge` |

**Repères géographiques de `plan-idf/geo.ts`** (latitude, longitude ; données publiques) :

| Élément | Points (lat, lng) |
|---|---|
| Seine | Villeneuve-Saint-Georges (48.732, 2.448) → Choisy-le-Roi (48.764, 2.409) → Ivry (48.815, 2.393) → Bercy (48.836, 2.380) → Île de la Cité (48.853, 2.349) → Grenelle (48.857, 2.290) → Billancourt (48.828, 2.252) → Saint-Cloud (48.845, 2.220) → Suresnes (48.871, 2.226) → Puteaux (48.884, 2.240) → Asnières (48.905, 2.270) → Saint-Denis (48.945, 2.345) → Épinay (48.955, 2.310) → Argenteuil (48.943, 2.250) → Bezons (48.930, 2.210) |
| Marne | Chelles (48.880, 2.590) → Neuilly-sur-Marne (48.855, 2.530) → Champigny (48.830, 2.510) → Joinville (48.820, 2.470) → confluence à Alfortville (48.815, 2.405) |
| Canal de l'Ourcq | La Villette (48.888, 2.373) → Pantin (48.894, 2.409) → Bobigny (48.900, 2.445) → Bondy (48.902, 2.480) → Sevran (48.935, 2.530) |

**Critères d'acceptation :**
- `npm run check` au vert ;
- le test de projection place les villes dans le bon quadrant par rapport à Paris, et le dépôt de Bobigny au nord-est ;
- planche de démonstration temporaire (captures jointes au compte rendu, page non versionnée) : chaque composant à 390 et 1 440, en normal et `--reduced` (états finaux complets) ;
- rendu de `/admin/tester` identique (icônes inchangées).

### H.4 Lots de pages (après S1, S2a et S2b, tous en parallèle)

Chaque lot ne possède que les fichiers listés. Ses dépendances sont uniquement les API de S1, S2a et S2b.

**L1 · Accueil**
- **Fichiers modifiés :** `src/app/(public)/page.tsx`, `src/components/home/hero.tsx`, `src/components/home/night-road.tsx`.
- **Fichiers créés :**
  - `src/components/home/` : `home.module.css`, `gantry.tsx`, `crossroads.tsx`, `story.tsx`, `story-map.tsx`, `price-section.tsx`, `price-moment-picker.tsx` (client), `highway-section.tsx`, `zone-section.tsx`, `faq-preview.tsx`, `home-scenes.tsx` (client), `scenes/hero-brake.scene.ts`, `scenes/story.scene.ts` ;
  - `src/server/site/price-examples.ts` (+ `price-examples.test.ts`) : `getHomePriceExamples(): Promise<{ weekday: PriceExample; night: PriceExample \| null; sunday: PriceExample \| null } \| null>` avec `type PriceExample = { priceTtcCents: number; includedLabels: string[]; when: string }`.
- **À ne pas toucher :** `sections.tsx`, `home-motion.tsx` (supprimés par L9).
- **Acceptation :**
  1. Planche mobile d'environ 12 écrans, planche ordinateur de 14 au plus.
  2. Capture mobile 00 conforme à E.1 : bas du bouton sous 600 px ; aucun point vert quand la disponibilité est vide.
  3. Aucune bande claire pleine largeur, aucune grille de cartes ; le ciel va de minuit à l'aube.
  4. Carrefour lisible sur un écran d'ordinateur et sur 1,2 écran mobile au plus ; un seul panneau jaune.
  5. Mobile, section « Comment ça marche » : aucun chevauchement sur aucune capture.
  6. Ticket : prix = `formatEurosShort(info.examplePrice.priceTtcCents)`, tampon « EXEMPLE », lignes sans montant. Le moment change le prix (valeurs du serveur). Sans exemple : « Votre prix en moins d'une minute ».
  7. `--reduced` : états finaux de E.1 à E.9.
  8. HTML compressé ≤ 40 Ko, nœuds ≤ 1 500, `check` et `e2e` au vert.

**L2 · /depannage**
- **Fichiers :** `src/app/(public)/depannage/page.tsx` et `src/components/pages/depannage/` (`opening-scene.tsx`, `dashboard.tsx`, `steps-road.tsx`, `tow-fallback.tsx`, `depannage-scenes.tsx`, `depannage.module.css`).
- **Acceptation :**
  - bouton « Estimer mon dépannage » sous 580 px ;
  - six voyants avec leur texte toujours visible, tous allumés en `--reduced` ;
  - route à quatre bornes ;
  - séquence de chargement à l'état final en `--reduced` ;
  - trois questions liées, « Prochaine sortie : Remorquage », aube « Besoin d'une dépanneuse maintenant ? » ;
  - aucune carte arrondie.

**L3 · /remorquage**
- **Fichiers :** `src/app/(public)/remorquage/page.tsx` et `src/components/pages/remorquage/` (`opening-scene.tsx`, `situations-stage.tsx`, `vehicles-gauge.tsx`, `price-legs.tsx`, `remorquage-scenes.tsx`, `remorquage.module.css`).
- **Acceptation :**
  - le chargement se joue (ordinateur : lié au défilement ; mobile : une fois) ;
  - la scène collante change d'état à chaque situation sur ordinateur ; vignettes sur mobile, sans rien de collant ;
  - catalogue complet sous le portique, aucun vert ;
  - trois trajets tracés ;
  - aube « Un véhicule à déplacer ? ».

**L4 · /zones-d-intervention**
- **Fichiers :** `src/app/(public)/zones-d-intervention/page.tsx` et `src/components/pages/zones/` (`areas.ts` (données reprises de la page), `opening-map.tsx`, `commune-search.tsx` (client), `areas-stage.tsx`, `zones.module.css`).
- **Acceptation :**
  - texte et bouton avant la carte sur mobile ;
  - « Pantin » → « Oui, nous intervenons à Pantin » ; « Lyon » → message « Pas dans la liste ? » ;
  - champ masqué sans JavaScript, listes complètes visibles ;
  - zones allumées par temps sur ordinateur ;
  - aucune distance en kilomètres affichée.

**L5 · /panne-autoroute**
- **Fichiers :** `src/app/(public)/panne-autoroute/page.tsx` et `src/components/pages/autoroute/` (`shoulder-scene.tsx`, `reflexes.tsx`, `autoroute.module.css`).
- **Acceptation :**
  - les réflexes commencent dans le premier écran à 390 × 664 ;
  - pas de bouton RNB AUTO en tête ;
  - lien `tel:112` dans le réflexe 4 ;
  - aucune dépanneuse RNB AUTO avant le panneau « SORTIE » ;
  - aucun chunk GSAP chargé (panneau Réseau) ;
  - aube calme.

**L6 · /questions-frequentes, /entreprise, /contact**
- **Fichiers :**
  - les trois `page.tsx` ;
  - `src/components/pages/faq/` (`question-road.tsx`, `faq-themes.tsx`, `faq-hash.tsx` (client), `faq.module.css`) ;
  - `src/components/pages/entreprise/` (`depot-opening.tsx`, `blueprint.tsx`, `commitments.tsx`, `entreprise.module.css`) ;
  - `src/components/pages/contact/` (`channels.tsx`, `contact.module.css`).
- **Acceptation :**
  - les 11 questions, groupées par thème ; `/questions-frequentes#prix-definitif` ouvre la question ; données FAQPage présentes ;
  - annotations du plan technique reprises des textes existants, aucune dimension ;
  - /contact : trois canaux juste sous le titre, sans animation d'entrée ; « À COMPLÉTER » si le numéro manque ; aucun chunk GSAP chargé.

**L7 · /demande**
- **Fichiers :**
  - `src/app/(public)/demande/page.tsx` ;
  - `src/components/request/request-flow.tsx` ;
  - `src/components/request/address-input.tsx` (branche `tone="dark"` seulement) ;
  - `src/components/request/photo-uploader.tsx` (prop facultative `frame?: "viewfinder"`) ;
  - nouveaux : `step-road.tsx`, `route-sheet.tsx`, `request-backdrop.tsx`, `request.module.css`.
- **Interdits :**
  - toucher à `actions.ts` ;
  - modifier les schémas, les appels serveur, la forme de `FlowState`, `STORAGE_KEY` ou la logique de `goTo` et `popstate` ;
  - changer les textes protégés (G.1).
- **Acceptation :**
  - `npm run e2e` au vert, sans modifier le test ;
  - captures de chaque étape à 390 et 1 440 (pickup, branche autoroute, destination, véhicule, problème, calcul, prix, coordonnées, envoyée) ;
  - texte « prix estimé » unique dans le document ;
  - message à 4 s visible avec un serveur ralenti (simulation) ;
  - barre d'action à deux boutons ;
  - bloc `<noscript>` visible sans JavaScript ;
  - aucun chunk GSAP ni Lenis.

**L8 · Pages légales, 404, erreur**
- **Fichiers :**
  - `src/app/(public)/mentions-legales/page.tsx`, `confidentialite/page.tsx`, `conditions-d-intervention/page.tsx` ;
  - `src/app/(public)/not-found.tsx`, `src/app/(public)/error.tsx` ;
  - `src/components/pages/legal/` (`legal-shell.tsx`, `legal.module.css`) ;
  - `src/components/pages/errors/` (`detour-scene.tsx`, `errors.module.css`).
- **Acceptation :**
  - sommaire collant sur ordinateur, `<details>` sur mobile ;
  - « À COMPLÉTER » au style chantier ;
  - « L'essentiel » fidèle au texte existant ;
  - 404 avec ses trois issues ;
  - aucune animation sur le texte ; aucun chunk GSAP chargé.

### H.5 L9 : Recette et nettoyage (après la fusion de tous les lots)

**Fichiers possédés :**
- `tests/e2e/urgence.spec.ts` (U1 à U4, U6, U8, U10) ;
- `tests/e2e/immersion.spec.ts` (A1, A3, G.1 textes uniques, absence de case à cocher hors formulaires, aucun débordement horizontal à 390, aucune erreur de console, `[data-reveal]` absent des actions) ;
- `playwright.config.ts` : ajout d'un projet `desktop` (Chromium 1 440 × 900, limité aux nouveaux fichiers de test). **Le projet `mobile` et `parcours.spec.ts` restent inchangés.**
- suppression de :
  - `src/components/home/sections.tsx` et `src/components/home/home-motion.tsx` ;
  - les exports `@deprecated` de `page-blocks.tsx` ;
  - l'alias `asphalt-grain` de `globals.css` ;
  - `@gsap/react` dans `package.json` et le fichier de verrouillage, s'il n'est plus utilisé ;
- mise à jour de la section « Direction visuelle proposée » de `docs/01-vision-et-parcours.md`, avec un renvoi vers `docs/09`.

**Acceptation :** liste I entièrement cochée, et planches de captures avant et après de toutes les pages jointes.

### H.6 Ordre et intégration

```
S1 Fondations ──► S2a Coque ─┐
              └─► S2b Kit  ──┴─► L1 · L2 · L3 · L4 · L5 · L6 · L7 · L8 (parallèle) ──► L9 Recette
```

- **Conflits :** aucun fichier n'est partagé entre deux lots d'une même phase. Les seuls passages de main sont séquentiels : `page-blocks.tsx` passe de S2a à L9, `globals.css` de S1 à L9.
- **Fusion :** dans l'ordre S1, S2a, S2b, puis les lots dans n'importe quel ordre, puis L9. Après chaque fusion : `npm run check`. Après les lots : `npm run e2e`.
- **Pendant la phase des lots,** l'accueil et les pages pas encore migrées continuent de fonctionner : les anciens blocs restent exportés et `sections.tsx` reste en place jusqu'à L9.

---

## I. Critères de recette globaux

**Urgence**
- [ ] Sur toutes les pages publiques, sans JavaScript : titre principal, Appeler, WhatsApp (et Demande sauf sur /demande) présents et utilisables.
- [ ] Titre principal, accroche et bouton principal à opacité 1 et sans transformation dès `DOMContentLoaded`. Aucun délai sur une action (`hero.tsx` et `PageHero` corrigés).
- [ ] À 390 × 664, le bas du bouton de l'accueil est sous 600 px. Sur /panne-autoroute, les réflexes sont dans le premier écran.
- [ ] Barre d'action jamais recouverte (5 positions de défilement par page, et pendant une transition de page). Deux boutons sur /demande.
- [ ] Aucun épinglage GSAP, aucun Lenis sur mobile ni sur /demande, aucun écran de chargement, aucun son.
- [ ] /demande : `npm run e2e` au vert sans modifier le test ; message à 4 s ; prix en texte immédiat ; « prix estimé », « Demande reçue » et la référence uniques dans le document.
- [ ] Avec GSAP et Lenis bloqués, chaque page est complète.

**Immersion et cohérence**
- [ ] Aucune section en fond plein clair, aucune grille de cartes, plus aucun `rounded-3xl` sur un bloc de contenu.
- [ ] Le ciel passe de minuit à l'aube sur chaque page, et la nuit retombe à chaque navigation.
- [ ] Ouverture de l'accueil : faisceau sur « dépannage ? » au chargement, freinage au défilement derrière la voiture en warnings.
- [ ] Carrefour au deuxième écran, avec le morph du panneau vers la page d'arrivée (navigateur compatible).
- [ ] Trois trajets visibles sur l'accueil, /remorquage et /demande, avec le même code (aller en pointillé craie, transport en jaune, retour en pointillé gris).
- [ ] Le même ticket sur l'accueil (EXEMPLE) et sur /demande (vrai prix, REÇUE après l'envoi).
- [ ] Chaque sous-page a son ouverture propre (bas-côté, chargement, vue du ciel, bande d'arrêt d'urgence, route en « ? », dépôt, borne d'appel, entrée d'agglomération, route barrée), sa « Prochaine sortie » (si prévue), son aube et le « Retour au dépôt ».
- [ ] Aucune couleur hors jetons. Vert pour WhatsApp seulement. Bleu dans les scènes d'autoroute seulement. Un seul jaune plein par écran.

**Contenu**
- [ ] Aucun texte inventé (relecture des textes nouveaux de E et F). Disponibilité et point vert seulement si la disponibilité est réglée. « À COMPLÉTER » partout où une information manque.
- [ ] Dépôt (libellé, ville, marqueur de carte) lu dans les réglages. Plus aucune constante `ORIGIN`.
- [ ] Aucune dépanneuse RNB AUTO sur une voie d'autoroute. Exemple de prix marqué « EXEMPLE ». Plan marqué « schématique », sans distance.
- [ ] Les quatre points de G.4 signalés à l'administrateur.

**Performance**
- [ ] Budgets de G.2 respectés : 48,6 Ko de GSAP différé au plus, et seulement sur les pages prévues ; HTML de l'accueil ≤ 40 Ko compressé ; nœuds ≤ 1 500.
- [ ] Lighthouse mobile : LCP ≤ 2,0 s, TBT ≤ 150 ms, CLS ≤ 0,02, sur l'accueil, /depannage et /demande.
- [ ] Boucles en pause hors de l'écran. Deux boucles visibles au plus. Aucun `filter: blur` sur mobile.

**Accessibilité**
- [ ] Un seul titre de niveau 1 par page. Décor `aria-hidden`. Ordre du clavier cohérent. Focus visible sur tous les panneaux.
- [ ] En « moins d'animations » (système ou bouton) : états finaux, aucune animation infinie, aucune animation liée au défilement, aucune animation de transition.
- [ ] Boutons de pause de l'ouverture et du panneau à messages, plus le bouton global, fonctionnels et mémorisés.
- [ ] `contrast.test.ts` au vert. Texte de 17 px au moins sur mobile. Zones de toucher de 48 px au moins.

**Qualité**
- [ ] `npm run check` au vert (avec les nouveaux tests unitaires) et `npm run e2e` au vert (avec `urgence.spec.ts` et `immersion.spec.ts`).
- [ ] Planches de captures à 390 et 1 440, en normal et `--reduced`, pour toutes les pages : aucun débordement horizontal, aucune erreur de console.
- [ ] Rendu de l'administration inchangé (`/admin/tester`, `/admin/parametres`).
- [ ] `docs/09-refonte-immersive.md` à jour. Fichiers morts supprimés (`sections.tsx`, `home-motion.tsx`, `page-motion.tsx`, exports dépréciés).

---

## J. Journal des écarts

Chaque écart au cahier est noté ici avec sa raison. Les lots suivants ajoutent leurs propres entrées à la suite.

### J.1 Lot S1 (fondations)

| # | Écart | Raison |
|---|---|---|
| S1-1 | Dans un module CSS, `@reference "@/app/globals.css"` (H.0-3) ne se résout pas : il faut un chemin relatif, par exemple `@reference "../../app/globals.css";`. | L'alias `@/` de TypeScript n'est pas connu du compilateur CSS de Tailwind (erreur « Can't resolve »). |
| S1-2 | Les valeurs par défaut que l'appelant peut vouloir changer (`position`, `display`, `perspective`…) sont dans `@layer components`, dans `motion.css` comme dans les modules CSS du socle. | Une règle de module CSS est hors couche : elle bat toujours les utilitaires Tailwind (couche `utilities`). Sans cela, `className="absolute"` ou `hidden` passé à `Skyline`, `Depot`, `Pmv` ou à un élément `[data-retro]` restait sans effet. **Règle pour les lots :** dans un `*.module.css`, mettre sous `@layer components { … }` toute propriété qu'une classe Tailwind de l'appelant doit pouvoir remplacer. |
| S1-3 | `::view-transition` reçoit `width: auto !important; height: auto !important`. | React réduit ce pseudo-élément à 0 × 0 par une animation figée quand la racine n'est pas capturée ; la découpe `clip-path: inset(...)` de D.4 masquait alors toute la transition. Une déclaration `!important` l'emporte sur une animation ; `pointer-events: none` laisse passer les clics. |
| S1-4 | Cercle de la page entrante : courbe `cubic-bezier(.33, 1, .68, 1)` (out-cubic) et rayon final `125vmax`, au lieu de `--ease-out-expo` et `150vmax`. Durée inchangée (360 ms). | Avec expo et 150vmax, le cercle couvre l'écran en 30 ms : l'« allumage » ne se voyait pas. 125vmax couvre encore la diagonale de tout écran. |
| S1-5 | Masque à points des LED (`led-mask`, `Pmv`) : points de 1,45 px (bord 1,8 px) au lieu de 1,25 px (1,6 px) ; texte du panneau en graisse 900. | Aux tailles de B.3, le texte du panneau était trop pâle et peu lisible (vérifié en capture). |
| S1-6 | `MotionToggle` : libellé fixe « Arrêter les animations », état donné par `aria-pressed` et par un interrupteur visuel (allumé = animations arrêtées). | Un bouton bascule dont le libellé change ET qui annonce `aria-pressed` donne un double état contradictoire aux lecteurs d'écran (« Relancer les animations, enfoncé »). |
| S1-7 | `MotionHeadScript` est un composant client : il rend le `<script>` dans le HTML du serveur et ne rend rien quand le layout est construit dans le navigateur (navigation depuis /admin). | Un script créé côté client ne s'exécute jamais et React affiche une erreur de console. Dans ce cas, `MotionRuntime` pose lui-même `html.js` et `data-motion`. |
| S1-8 | Contrat P10 précisé : classe `draw` sur tout tracé `pathLength="1"` à dessiner ; `data-draw-mask="<id>"` sur un tronçon en pointillés (l'aide recopie `--draw` sur le tracé plein du masque) ; bornes facultatives `data-route-start` / `data-route-end` en mode `scrub` ; la racine reçoit `data-route-current="<tronçon>"`. | Le cahier ne fixait pas ces noms ; S2b en a besoin pour `RoutePaths`. |
| S1-9 | P16 : variante `data-arrive="right"` (entrée par la droite) et variable `--arrive-delay` ; `Depot` accepte `--depot-delay`. | Le pied de page enchaîne arrivée, extinction et rideau (D.8). |
| S1-10 | Ciel (P1) : en plus des 12 / 24 étoiles, une poussière d'étoiles très fines (ordinateur seulement), des nappes de nuages éclairées par la ville (elles s'éteignent avec `--city-glow`) et une brume basse. | Le ciel est l'atmosphère de tout le site ; ces couches sont statiques (aucune repeinte au défilement). |
| S1-11 | Apparition (P2) : propriété CSS `translate`, pas `transform`. | Ne détruit pas un `transform` posé par la page sur le même élément. Conséquence : ne pas mettre d'utilitaire `translate-*` sur un élément `[data-reveal]` ou `[data-arrive]`. |
| S1-12 | `MotionRuntime` lance le cycle de page dans `useLayoutEffect`, et Lenis est recréé à chaque page (pas de `scrollTo(0)`). | La nouvelle page n'est jamais peinte avec des éléments visibles cachés ; Next gère déjà le retour en haut et les ancres. |
| S1-13 | `runtime/helpers.ts` ne référence jamais GSAP : le runtime lui passe le chargeur. | Turbopack chargeait le morceau GSAP avec `helpers.ts` ; si GSAP était bloqué, les scènes sans GSAP échouaient aussi. |
| S1-14 | `ScenePause` pose aussi `data-user-paused` sur la cible. | Sinon l'observateur « hors écran » relançait une scène mise en pause par le visiteur dès son retour dans l'écran. |
| S1-15 | L'alias `asphalt-grain` pointe déjà vers la tuile PNG. | Il n'est utilisé par aucune page : aucun changement visible. |
| S1-16 | `scripts/review-shots.mjs` lit l'adresse du serveur dans `REVIEW_BASE_URL` (par défaut `http://localhost:3000`) ; sortie par défaut : `<tmp>/rnb-review`. | Utilisable contre le serveur de test séparé. |
| S1-17 | Les dossiers de démonstration ignorés par Git (`src/app/motion-lab/`, `src/app/kit-demo/`) ne sont pas lus par Tailwind : le laboratoire importe sa propre feuille (`@reference "../globals.css"; @source "./"; @import "tailwindcss/utilities" layer(utilities);`). | Détection automatique des sources de Tailwind v4 : les fichiers ignorés par Git sont exclus. |
| S1-18 | Lenis ne s'arrête plus quand un champ a le focus : il rend seulement la molette au défilement natif (`smoothWheel: false`) tant que le champ est actif. Il s'arrête toujours quand le menu est ouvert. | Un Lenis arrêté annule la molette (`preventDefault`) et pose `overflow: clip` sur `<html>` : toute la page était figée tant que le curseur restait dans un champ (recherche de commune, par exemple). |
| S1-19 | `.motion-ready` reste posée d'une page à l'autre (le runtime la retire seulement en niveau `off` ou au démontage). | La retirer puis la remettre à chaque navigation relançait les animations des éléments du layout (pied de page). **Pour S2a :** un élément du layout qui a déjà reçu `data-inview` garde son état final sur les pages suivantes (il n'est pas réarmé). |

### J.2 Lot S2a (coque : en-tête, menu, barre d'action, fins de page)

| # | Écart | Raison |
|---|---|---|
| S2a-1 | Pied de page : le dépôt est à gauche ; la dépanneuse vide (en miroir, tournée vers la gauche) arrive par la droite et se gare à droite du dépôt, phares braqués sur lui. | Une dépanneuse tournée vers la gauche qui rejoint un dépôt placé à droite devrait reculer ; ainsi, on lit tout de suite un retour au dépôt. |
| S2a-2 | Les arrivées du pied de page et de `DawnCta` n'utilisent pas `data-arrive` : un couloir immobile sert de déclencheur et une dépanneuse intérieure arrive (mêmes courbes, même freinage ; 2 s dans le pied de page, comme le demande D.8). | `data-arrive` déplace l'élément observé lui-même : un couloir qui part du bord de l'écran en sortait entièrement et n'était jamais vu (dépanneuse invisible, constaté). |
| S2a-3 | Le pied de page ne passe pas par `data-inview` : l'en-tête pose `data-play` (son propre observateur, seuil de 92 %) et le réarme à chaque navigation ; le rideau du dépôt est piloté par la coque. | Le runtime ne réarme pas le layout (S1-19), et au moment de son cycle la position de défilement est encore celle de l'ancienne page. Arrivée, extinction et rideau partent d'un même déclencheur. |
| S2a-4 | Le pied de page ne donne l'heure « aube » au ciel que si la page a au moins un `[data-sky]`. | Le runtime prend le premier `[data-sky]` du document : une page sans heure serait restée à l'aube du haut en bas. |
| S2a-5 | En-tête de 1 024 à 1 279 px : losange du logo seul, liens un peu plus petits. | Avec le nom complet, la navigation et les deux actions débordaient de 40 à 125 px (mesuré). |
| S2a-6 | Titres du menu mobile en 1,375 rem, largeur de police 90 (au lieu de 1,5 rem en largeur 112). | À 390 px, deux titres passaient sur deux lignes, et Appeler et WhatsApp sortaient du premier écran du menu. |
| S2a-7 | Interligne des grands titres porté à 0,95 ou 0,96 (au lieu de 0,92). | L'accent d'une capitale (É) touchait la ligne du dessus. |
| S2a-8 | `GroundText` devient une vraie route en perspective (plan incliné, lignes de rive, tirets, plots) qui porte le texte peint ; le texte est facultatif. | Le texte au sol seul débordait sur les côtés ; `DawnCta` a besoin de la route même sans texte. |
| S2a-9 | `CallLink` reçoit `missing` (`marker`, `plain`, `hidden`) et `size` ; `PrimaryLink` reçoit la taille `sm`. | Aucun marqueur « N° à compléter » caché ne doit précéder le contenu (test de /contact) ; D.5 prévoit « rien » dans l'en-tête quand le numéro manque. |
| S2a-10 | Une ligne ajoutée dans `runtime/lenis.ts` : pas de second Lenis si `<html>` porte déjà la classe `lenis`. | Cohabitation temporaire avec l'ancien `home-motion.tsx` de l'accueil (deux Lenis écoutaient la molette). |

À retenir :
- Pendant la phase de mise à jour d'une transition de page (entre `startViewTransition` et la fin de la mise à jour du DOM), le navigateur suspend le rendu et `elementFromPoint` renvoie `<html>` (118 à 264 ms en développement). Le test U6 mesure donc à partir de `ready` (voir J.13).
- Le rideau du pied de page dépend de la structure interne du dessin `Depot` (`g[clip-path] > g`) : à adapter si ce dessin change.

### J.3 Lot S2b (kit d'illustrations)

| # | Écart | Raison |
|---|---|---|
| S2b-1 | Props facultatives ajoutées à H.3 : `RoutePaths.scale` et `truckScale`, `TruckTopGlyph.tone`, `InfoPlaque.titleAs`, `Voyant.showLabel`, `VoyantGroup.as`, `className` sur plusieurs dessins, `LoadingSequence.scrubStart` et `scrubEnd`, et quelques utilitaires (`planPoint`, `findCity`…). | `vector-effect: non-scaling-stroke` est incompatible avec `pathLength` (tirets faux) : l'épaisseur doit suivre l'échelle. Les pages doivent aussi placer des tracés sur le plan, choisir le niveau de titre et régler les bornes du défilement. Valeurs par défaut conformes au cahier. |
| S2b-2 | La scène de `LoadingSequence` déclare `needsGsap` pour ses deux modes. | `needsGsap` est lu avant l'initialisation, sans la racine : il ne peut pas dépendre du mode. Les pages concernées chargent GSAP de toute façon. |
| S2b-3 | `LoadingSequence` « une fois », déjà visible au démarrage : la voiture s'efface, puis réapparaît au pied de la rampe avant le chargement ; plateau incliné à 13° au lieu de 9°. | L'état de base est l'état final (voiture chargée) : sans ce fondu, elle sauterait du plateau au sol. À 9°, la montée n'était pas crédible. |
| S2b-4 | Balayage du gyrophare de `PlanIdf` : 16 tranches SVG pivotées au lieu d'un `conic-gradient`. | Reste aligné sur le dépôt quel que soit le cadrage ; seul un `transform` est animé. |
| S2b-5 | Ticket : l'impression concerne tout le ticket ; le prix est entier vers 250 ms (au lieu de 150 ms). | Contrainte de la durée d'impression. Le vrai texte est dans la page dès le rendu. |
| S2b-6 | Relais d'autoroute sans JavaScript : schéma en trois temps (voiture sur la bande d'arrêt d'urgence, dépanneur agréé à la sortie, RNB AUTO à destination), un seul trajet en deux tronçons. | Une image fixe doit raconter les trois temps ; deux tronçons permettent de changer de véhicule au relais. |
| S2b-7 | Plan régional : les communes cachées sous le losange du dépôt ne sont pas dessinées ; les noms de Seine-Saint-Denis sont placés à la main. | Sinon les noms se chevauchent à 560 px. |
| S2b-8 | Étiquettes de schéma (« DÉPANNEUR AGRÉÉ », « SORTIE », « Vous », « Aller / Transport / Retour ») absentes des textes de E et F. | Ce sont des légendes de schéma, sans chiffre, horaire ni distance. |

À retenir : la voiture chargée par `TowTruck` (berline) n'est pas la même que la voiture du client dessinée par `CarSide` (citadine sombre) ; on ne reconnaît pas la même voiture d'une scène à l'autre (/depannage, /remorquage).

### J.4 Lot L1a (accueil : ouverture, portique, carrefour, récit)

| # | Écart | Raison |
|---|---|---|
| L1a-1 | Freinage : le texte de l'ouverture monte et pâlit jusqu'à 0,15, mais les boutons restent à opacité 1. | C.1-2 : une action n'est jamais estompée. |
| L1a-2 | Carte du récit écrite en version légère dans `story-map.tsx` (même contrat P10 que `RoutePaths`), avec des glyphes définis une fois et réutilisés par `<use>`. | Budget de nœuds : la section passe de 728 à environ 370 nœuds. |
| L1a-3 | Temps de la carte déclenchés par `data-beat` (tracés de 900 ms par tronçon) plutôt qu'un tracé lié en continu au défilement ; la scène pose `data-story`. | L'aide P9 pose le premier temps dès l'initialisation : sans `data-story`, l'épingle tombait hors de l'écran. Même rendu en `full` et en `lite`. |
| L1a-4 | Carrefour : ligne médiane et bretelles en CSS (sans SVG), et une dépanneuse vue de dessus qui descend la route avec le défilement (niveau `full`, CSS seul). | La géométrie suit toujours la hauteur des panneaux ; l'écran n'est plus statique. |
| L1a-5 | Panneau à messages : deux instances (deux lignes sur téléphone, une ligne à partir de 1 024 px), taille des LED réduite sur téléphone. | À 390 px, « EN MOINS D'UNE MINUTE » débordait. |
| L1a-6 | Légende `sr-only` « Trajets de la dépanneuse » sur l'interrupteur ; sans ville du dépôt réglée, l'étape 3 devient « … puis la dépanneuse part vers vous. » | Un groupe de boutons radio a besoin d'un nom ; aucune ville n'est inventée. |
| L1a-7 | Téléphone : marge basse de l'ouverture égale à la hauteur de la barre d'action ; bouton Pause en haut à droite de la scène. | Sinon la route et les véhicules étaient cachés sous la barre. |

Corrections importantes du contrôle : les scènes du freinage et du récit ont été réécrites sans GSAP (aucune requête GSAP en `lite` sur téléphone) ; la page tient en 14 écrans sur ordinateur.

Restait ouvert à la fin du lot : budget de nœuds de l'accueil (environ 2 800 pour 1 500 : la coque en fait déjà environ 550) et poids du HTML compressé en production, à arbitrer et mesurer en L9.

### J.5 Lot L1b (accueil : prix, autoroute, zone, questions)

| # | Écart | Raison |
|---|---|---|
| L1b-1 | Fenêtre de rue en 16:9 à toutes les largeurs (environ 200 px de haut à 390 px au lieu de 180). | La dépanneuse (HTML) est posée sur le dessin en pourcentages : avec un autre cadrage, elle ne tombait plus sur la chaussée. |
| L1b-2 | « Le dimanche » : lumière du jour et rideaux des commerces baissés ; la nuit, les fenêtres s'allument en cascade avant les lampadaires. | Le choix se voit dans la scène sans afficher d'heure ni d'information inventée. |
| L1b-3 | Ciel de jour de la fenêtre obtenu par mélange de jetons (`color-mix`). | Aucun jeton de ciel de jour n'existe ; aucune nouvelle couleur. |
| L1b-4 | Le lien « Que faire en cas de panne sur autoroute » est une plaque sombre à liseré orange, pas un panneau de direction. | En panneau, il s'étalait sur 3 à 4 lignes et passait devant l'action ; le panneau jaune reste réservé à « Demander le relais ». |
| L1b-5 | Panneau : titre « Demander le relais », sous-titre « Votre véhicule est sorti ? » (ordre inversé). | Sur un panneau, l'action est l'inscription principale ; le texte est complet. |
| L1b-6 | Réflexes autoroute : quatre plaques fixées sur un mât ; plaque PK 04 orange avec pictogramme. | Un objet de la route plutôt qu'une grille de cartes ; l'orange reste réservé à la sécurité. |
| L1b-7 | Titre de zone : « Basés à {ville du dépôt}. Partout en Île-de-France. » ; sans ville réglée, « Partout en Île-de-France. ». La phrase « Au cœur de la Seine-Saint-Denis, à quelques minutes de Paris et des grands axes. » est reprise mot pour mot. | Une ville réglée n'est jamais écrite en dur ; le texte existant est conservé (à faire valider, voir docs/07 E). |
| L1b-8 | Section des questions : un bord de route immobile (balises, borne PK 06). | E.8 demande une section calme : le décor ne bouge pas. |
| L1b-9 | Plaques PK : « Prix transparent », « Zone d'intervention », « Questions fréquentes ». | Ce sont les surtitres de l'ancien accueil, repris mot pour mot. |
| L1b-10 | `Odometer` : roule de l'ancienne valeur vers la nouvelle en 700 ms (vers le haut si le prix monte, vers le bas s'il baisse) ; hauteur des cases mesurée avec `offsetHeight` ; chaque colonne découpée à la hauteur des chiffres. | `getBoundingClientRect` est faux sur un ticket incliné : les chiffres voisins apparaissaient pendant le roulement. |

### J.6 Lot L2 (/depannage)

| # | Écart | Raison |
|---|---|---|
| L2-1 | Ouverture : la dépanneuse est garée nez à nez avec la voiture (la voiture est en miroir), pas « derrière ». | Un démarrage aux câbles se fait moteur contre moteur ; avec la dépanneuse derrière, le câble aurait longé toute la voiture. |
| L2-2 | Le câble ne se redessine pas au chargement : seuls le courant et le témoin de charge (1,2 s) sont animés. | La scène est visible dès la première image ; effacer puis redessiner le câble produisait un saut. |
| L2-3 | Tableau de bord : voyants en 3 × 2 à partir de 1 280 px, en 2 × 3 entre 1 024 et 1 279 px ; compte-tours à côté du titre seulement à partir de 1 024 px, taille adaptée. | À 1 024 px, trois colonnes donnaient des lignes de 3 ou 4 mots et le compte-tours touchait le titre. |
| L2-4 | Décor ajouté sans texte : planche de bord, plots rétroréfléchissants, rangée de chevrons, balise et lampadaire. | Immersion « du haut en bas », sans zone morte entre les sections (B.4). |
| L2-5 | Questions liées : `prix-sur-place`, `presence`, `sans-le-site` (F.1 citait `sans-site`). | `sans-site` n'existe pas dans `faq.ts`. |
| L2-6 | Le texte « Remorquage » (petite étiquette) devient la ligne d'aide du panneau de direction. | Le panneau place l'aide sous l'inscription ; texte inchangé. |

Restait ouvert : à 390 px, la plaque « PK 01 · LES SITUATIONS COURANTES » se coupe après « LES » (équilibrage des lignes du socle).

### J.7 Lot L3 (/remorquage)

| # | Écart | Raison |
|---|---|---|
| L3-1 | Taille du titre principal plafonnée : `min(text-hero, 12,5vh)` sur ordinateur, `min(text-hero, 16vw)` sous 1 024 px, et `min(text-hero, 11vh, 8vw)` de 1 024 à 1 279 px. Le h1 reste immobile. | Avec `text-hero`, le bouton principal sortait du premier écran (ordinateur, 1 024 × 768) et dépassait la limite U4 de 580 px. |
| L3-2 | Le titre de PK 02 n'est pas découpé en lignes (`data-split`). | Le découpage cassait la ligne à l'espace insécable avant « ? » : le « ? » partait seul à la ligne. |
| L3-3 | Appeler à côté du bouton principal de l'ouverture, sur ordinateur seulement. | Appeler en une seconde depuis l'ouverture ; sur téléphone, la barre d'action le fait déjà. |
| L3-4 | La scène collante n'existe que sur ordinateur à pointeur fin, avec JavaScript et hors `off` ; ailleurs, les situations sont une liste avec leurs vignettes. Panneau de direction sans texte ajouté à l'ouverture. | P9 en `off` demande les visuels à côté de chaque texte ; sans pointeur fin, la scène resterait figée au premier temps. |
| L3-5 | Les trois garanties sont imprimées sur le ticket du kit (sans montant), au lieu d'une liste. | B.8 prévoit le ticket sur cette page ; pas de liste de cartes. |

Corrections importantes du contrôle : chargement lié au défilement réglé avec `scrubEnd="bottom 22%"` (il se terminait en 150 px) ; ouverture reconstruite (route mouillée, lampadaire, ville au loin).

### J.8 Lot L4 (/zones-d-intervention)

| # | Écart | Raison |
|---|---|---|
| L4-1 | Ouverture propre (`OpeningMap`) au lieu d'`OpeningShot` : carte de 60svh sur téléphone, carte de 80vh à droite derrière un voile sur ordinateur. Titre, accroche et bouton immobiles (bas du bouton à 548 px à 390 × 664). | `OpeningShot` limite la scène à 34svh sur téléphone. |
| L4-2 | Titre en `clamp(3rem, 14vw, 5.5rem)`. | Avec `text-hero`, quatre lignes et un accent qui touchait la ligne du dessus. |
| L4-3 | PK 03 : la première phrase du paragraphe existant devient le h2 ; libellés repris de mots existants. | Un h2 par section (A1) ; F.3 ne fixait pas ce titre. |
| L4-4 | Ajouts sans texte nouveau : légende des 4 secteurs (liens d'ancre), panneau vers /panne-autoroute, trajet et dépanneuse sur le plan collant, onde du dépôt, bascule de caméra. | Aucune section ne reste un texte seul. |
| L4-5 | Pas de reflet `data-retro` sur les plaques de secteurs. | Sur des plaques hautes, le reflet passait longtemps sur la liste et gênait la lecture. |
| L4-6 | Section PK 01 (recherche de commune) entièrement masquée sans JavaScript. | Sans champ, son titre n'aurait rien en dessous ; les listes complètes suivent. |
| L4-7 | Marges basses des sections réduites. | Zones mortes d'environ 290 px entre les scènes. |

Restait ouvert : « Depuis Bobigny » est écrit en dur dans le titre (texte existant, voir docs/07 E) ; sur tablette tactile de 1 024 à 1 279 px, le plan collant reste à l'état final ; sans découpage en lignes, l'équilibrage coupe les mots à trait d'union (« INTERVENONS- / NOUS ? »).

### J.9 Lot L5 (/panne-autoroute)

| # | Écart | Raison |
|---|---|---|
| L5-1 | Ouverture et sections PK 01 et PK 02 rendues par des composants du lot (avec `Plate`), pas par `OpeningShot` et `Section`. Rien n'apparaît en montant sur cette page. | Il faut les réflexes avant la scène sur téléphone et une scène collante sur ordinateur ; `Section` pose `data-reveal`, que C.6 exclut ici. |
| L5-2 | Titre principal plus petit sur téléphone (`min(text-hero, 13,6vw)`, 53 px à 390 px). | « Votre sécurité » tient sur une ligne et le premier réflexe remonte dans le premier écran. |
| L5-3 | Intitulés existants « Les bons réflexes » et « Que faire tout de suite ? » gardés en h2 ; nouvelles étiquettes courtes « PK 02 · Le relais » et repère « Questions ». | F.4 ne donne pas d'étiquette pour PK 02 ; « relais » est déjà le mot du bouton. |
| L5-4 | `HighwayRelay` sans légendes : les trois plaques (textes existants) servent de légendes, reliées au schéma. | Sinon les titres apparaissaient deux fois. |
| L5-5 | Bande d'arrêt d'urgence et bretelle de sortie calculées en perspective (`perspective.ts`, testé) ; la ville est dessinée dans le SVG au lieu de `Skyline`. | Avec un cadrage recadré, une `Skyline` HTML ne restait pas sur l'horizon du dessin. |
| L5-6 | Panneau bleu de l'ouverture sans le mot SORTIE ; le premier panneau SORTIE est celui du relais. | C'est le « panneau bleu générique » de F.4. |
| L5-7 | Aucune apparition sur le relais et ses plaques ; le reflet du kit est gardé. | Intensité minimale (C.6) ; le reflet ne touche aucun texte de sécurité. |

Restait ouvert : le runtime arme encore le halo des phares sur cette page (C.6 : « Lenis seulement ») ; le lien `tel:112` et le texte « (tous les 2 km) » sont à faire valider (docs/07 E).

### J.10 Lot L6 (/questions-frequentes, /entreprise, /contact)

**/questions-frequentes (L6a)**

| # | Écart | Raison |
|---|---|---|
| L6a-1 | Le trajet de la dépanneuse sur la route en « ? » est animé par une scène (suivi du tracé SVG, sans GSAP), pas par `offset-path`. | La scène change de taille selon l'écran ; tracé et véhicule partagent le même repère. État final (garée) sans JavaScript et en `off`. |
| L6a-2 | Titre principal : `min(15vw, 8.5rem)` sous 1 024 px, `clamp(4rem, 6.6vw, 6rem)` au-delà. | U4 (bas du bouton à 449 px au lieu d'environ 587) et ouverture contenue sur ordinateur. |
| L6a-3 | Les thèmes qui n'ont qu'une question (Autoroute, Véhicules) l'affichent ouverte. | Sinon la section se réduisait à une seule ligne fermée. |
| L6a-4 | Plaques « PK 0X · N questions » (nombre calculé), titres et barre des thèmes avec les libellés de `FAQ_THEMES` ; ancres préfixées `theme-`. | `faq.ts` est la seule source ; certaines ancres de questions portaient déjà ces noms. |
| L6a-5 | Pas de questions liées sur cette page. | La page est déjà la liste complète. |
| L6a-6 | Aube : « Appelez-nous ou écrivez-nous sur WhatsApp. » | Fragment exact de l'accroche existante. |

À retenir : sans JavaScript, une ancre amène bien à la question, mais il faut un geste pour l'ouvrir (impossible en CSS) ; `scroll-padding-top` est fixé à 5 rem alors que l'en-tête mobile fait 64 px.

**/entreprise et /contact (L6b)**

| # | Écart | Raison |
|---|---|---|
| L6b-1 | Plan technique de la dépanneuse : libellés de F.6, mais chaque annotation porte la phrase existante complète. | Reprendre les anciens paragraphes mot pour mot sans les afficher deux fois. |
| L6b-2 | Questions liées ajoutées sur /entreprise. | Ordre commun des sous-pages (D.10) ; pas de zone vide avant la Prochaine sortie. |
| L6b-3 | /contact : ouverture sur mesure (titre, puis façade de trois touches Téléphone, WhatsApp, Demande) ; borne dessinée seulement sur ordinateur. | Les trois canaux sont entiers dans le premier écran à 390 × 844 comme à 1 440 × 900. |
| L6b-4 | /contact : le h2 de l'adresse est le libellé du dépôt et celui de l'email est l'adresse (préfixes `sr-only` « Adresse : » et « Email : »). | Pas de répétition des mots portés par les plaques ; le contexte reste annoncé aux lecteurs d'écran. |
| L6b-5 | /entreprise : la dépanneuse de l'ouverture garde son gyrophare et part vers la droite au défilement (niveau `full`). | Du mouvement à la sortie de l'ouverture, cohérent avec « avant le départ ». |
| L6b-6 | Plan technique joué en moins de 700 ms au total. | C.1-4 : tout texte lisible au plus tard 700 ms après son entrée. |

### J.11 Lot L7 (/demande, habillage)

| # | Écart | Raison |
|---|---|---|
| L7-1 | Le sens du glissement entre étapes est déduit pendant le rendu ; seul ajout dans `goTo` : le focus du titre. | Le sens reste juste avec le bouton retour du téléphone et la reprise de saisie, sans toucher à la logique du parcours. |
| L7-2 | Feuille de route masquée à l'étape « Coordonnées ». | Le récapitulatif du formulaire montre déjà les mêmes lignes. |
| L7-3 | Barre mobile de la feuille de route de 48 px (au lieu de 44). | Zones de toucher de 48 px au moins. |
| L7-4 | « Votre estimation » devient le h1 de l'étape Prix (texte inchangé). | Un seul h1 par écran et une cible pour le focus. |
| L7-5 | L'intertitre « Pris en compte » disparaît : les éléments inclus deviennent les lignes cochées du ticket, avec les kilomètres. | Anatomie du ticket (B.8, F.8). |
| L7-6 | Étape Prix sur ordinateur : schéma des trois trajets (vrais kilomètres) et boutons à côté du ticket. Sur téléphone, « Demander le dépannage » est juste sous le premier écran. | Le ticket (7 lignes) est trop haut sur téléphone ; Appeler et WhatsApp restent dans la barre. |
| L7-7 | Pas de reflet `data-retro` sur les tuiles ni sur la référence. | Sur une page qui ne défile pas, le reflet restait figé en bande blanche. |
| L7-8 | Mini-dépanneuse sans gyrophare ; boucles du décor figées pendant le calcul. | Deux boucles visibles au plus (C.1-8). |

Restait ouvert : près du dépôt (Pantin), l'épingle « Vous » chevauche le losange et l'étiquette du dépôt sur le plan (vraie géographie) ; le lien `tel:112` de la branche autoroute est à faire valider.

### J.12 Lot L8 (pages légales, 404, erreur)

| # | Écart | Raison |
|---|---|---|
| L8-1 | Pages légales : quelques lumières de décor (reflet sur la plaque au chargement, tête des bornes qui s'allume), en CSS, niveau `full` seulement. Aucun texte animé. | Une mise en scène sur chaque écran, sans gêner la lecture. |
| L8-2 | Pas de `content-visibility: auto` sur les sections légales. | Sections courtes : rien à gagner, et la taille estimée faussait l'arrivée des ancres du sommaire. |
| L8-3 | Ciel des pages légales : minuit (ouverture), nuit (corps), heure bleue (fin), aube (pied de page). | Décision clé 2 : chaque page va de minuit à l'aube. |
| L8-4 | Titre principal écrit dans la plaque d'entrée d'agglomération, sans `OpeningShot` ; pas d'accroche sur /mentions-legales (il n'y en avait pas). | F.9 demande le titre sur la plaque. |
| L8-5 | 404 et erreur : section « Déviation », un mât vers les pages du menu (libellés et aides existants). | Une personne perdue retrouve la bonne page en un geste. |
| L8-6 | 404 : la dépanneuse arrive en CSS au chargement sur ordinateur, à l'entrée dans l'écran sur téléphone ; gyrophare éteint. | Une animation dans le temps finit toujours à l'état final ; deux boucles visibles au plus. |
| L8-7 | « À COMPLÉTER » entouré d'une bordure de chantier à chevrons (composant local). | F.9 demande cette bordure ; le marqueur du socle n'a qu'une bande. |
| L8-8 | Page d'erreur : `retry()` (Next 16.3) en plus de `reset()`. | Recommandation de la documentation de Next 16.3. |
| L8-9 | La 404 d'une adresse inconnue (`src/app/not-found.tsx`) recompose la coque publique ; en L9, cette composition est partagée avec le layout public (`src/components/public/public-shell.tsx`). | Elle est rendue hors du groupe `(public)`, donc sans son layout. |

Pièges à retenir pour la suite :
- dans un `*.module.css`, écrire `:global(.motion-ready)` et `:global(.js)`, sinon la classe est renommée et la règle ne s'applique jamais ;
- un lien découpé par `clip-path` perd son contour de focus : prévoir un focus de remplacement (liseré plus épais, face éclaircie) ;
- avec `data-follow-section`, garder les sections jointives (`padding`, pas `margin`), sinon la ligne centrale tombe entre deux sections.

Restait ouvert : le texte existant « Les boutons Appeler et WhatsApp en bas de l'écran » de la page d'erreur est faux sur ordinateur (à relire) ; les adresses inconnues sous /admin affichent la 404 publique ; Lenis était encore chargé sur la 404 sur ordinateur.

### J.13 Lot L9 (recette et nettoyage)

La recette est répartie en chantiers ; chacun rend un compte rendu (corrections, mesures avant et après, captures à 390 et 1 440 px, en normal et en « moins d'animations »). Ces comptes rendus, joints à la livraison du lot L9, font foi pour le détail ; cette section n'en garde que les règles durables.

- **Tests de recette** : `tests/e2e/urgence.spec.ts` (U1 à U4, U6, U8, U10) et `tests/e2e/immersion.spec.ts` (A1, A3, textes uniques de G.1, cases à cocher, débordement horizontal, erreurs de console, `[data-reveal]`, `data-sky`, GSAP absent des pages calmes). Ils couvrent toutes les pages publiques, y compris la page « Route barrée » d'une adresse inconnue. Leurs aides communes (liste des pages, défilement de haut en bas, attente du moment calme, choix d'une adresse dans /demande…) sont écrites une seule fois, dans `tests/e2e/helpers.ts` ; `parcours.spec.ts` ne les utilise pas. Le projet Playwright `desktop` (1 440 × 900) n'exécute que ces deux fichiers ; le projet `mobile` les exécute aussi, à 390 × 844.
- **U6 pendant une transition** : la mesure se fait à `ready` de la transition (après la phase de mise à jour du DOM, voir J.2), 100 ms plus tard et à la fin.
- **U8** : le test retarde la réponse du serveur à l'estimation (7 s) pour vérifier le message de 4 s, puis contrôle, dans la même image, le titre, le prix dans la zone `aria-live` et le bouton actif.
- **Sur ordinateur**, la barre d'action n'existe pas (à partir de 768 px) : U1 et U6 contrôlent les liens de l'en-tête. Sans numéro réglé, l'en-tête n'affiche pas Appeler (D.5) ; le lien Contact y mène.
- **A3** : en niveau `off`, le test refuse toute animation infinie en cours et toute animation liée au défilement, avec une seule exception : le fondu « il reste des liens » en bas du menu mobile (`menu-fade`), un indicateur d'état du défilement de la liste qui ne déplace rien.
- **Bruit du serveur de développement** : l'erreur Turbopack « No link element found for chunk … css » (course au chargement d'une feuille CSS pendant la compilation) est ignorée par les tests ; elle n'existe pas en production.
- **Mesure du budget de HTML (G.2)** : elle se fait avec la compression du serveur de production, pas avec le gzip par défaut de `next start`. Accueil, build de production du 04/10/2026, 250 Ko de HTML brut : 42,2 Ko en gzip servi par `next start`, 37,3 Ko en zstd niveau 3 (niveau par défaut de Caddy), 28,3 Ko en brotli 11. Un navigateur qui ne lit pas zstd reçoit du gzip (environ 42 Ko) : seul le brotli (Vercel) laisse une marge nette sous 40 Ko. `docs/08` (section 3) donne la configuration de Caddy qui compresse en zstd.
- **Code mort retiré** : l'ancien code de l'accueil (`src/components/home/sections.tsx`, `src/components/home/home-motion.tsx`) est supprimé, et `@gsap/react`, qui n'était plus importé que par `home-motion.tsx`, est retiré de `package.json` et du fichier de verrouillage. Pour le mouvement, il ne reste que `gsap` et `lenis`.
- **Piège corrigé pendant la recette** : la vitre de l'en-tête sans JavaScript (`html:not(.js) .header::after`, animation liée au défilement) s'appliquait aussi avec JavaScript et en niveau `off`, car `.js` était renommé par le module CSS. Le test A3 l'a détecté ; la règle est maintenant écrite `:global(html:not(.js)) .header::after`.

#### Écarts de la recette L9, par chantier

| # | Écart | Raison |
|---|---|---|
| L9-F1-1 | Reflet rétroréfléchissant (P6) : il n'est plus lié au défilement. Le runtime pose `data-retro-play` pendant un balayage unique de 900 ms, quand le haut de la plaque passe à 65 % de l'écran, ou dès son apparition si le défilement ne peut jamais l'y amener. Au repos, la bande est hors de la plaque. Sans JavaScript, le reflet ne joue qu'au survol et au focus. | Un reflet lié au défilement restait figé en bande blanche quand le visiteur s'arrêtait. |
| L9-F1-2 | Marqueur de page calme `data-calm` (ou `"full"`) : ni Lenis ni halo ; `data-calm="halo"` : sans halo, Lenis gardé. Le runtime le lit aussi s'il apparaît plus tard (page d'erreur) et rallume le halo s'il disparaît. `NO_HALO_ROUTES = ["/panne-autoroute"]` : Lenis sans halo. | C.6 : la page d'urgence et les pages d'erreur restent sobres ; la 404 et l'erreur ne sont pas des routes connues d'avance. |
| L9-F1-3 | Scintillement des étoiles fini (quatre cycles, 12 à 20 s), ordinateur et niveau `full` seulement. | Ce n'est plus une boucle au sens de C.1-8. |
| L9-F1-4 | Compteur du prix : chaque colonne est un tambour fondu sur ses bords, avec un espace entre les chiffres ; sur /demande, 600 ms (au lieu de 700), lancé avant la première image. | Deux demi-chiffres collés se lisaient mal ; le prix final est lisible vers 620 ms. |
| L9-F1-5 | `Pmv` : taille des LED ajustée à la plus longue ligne (20 px au moins), police étroite (largeur 75) sous 30rem ; option `joinFrom="lg"` (message en deux parties sur une ligne à partir de 1 024 px). | Aucun débordement à 360 px. Sous 360 px, une ligne de 22 caractères peut être rognée de quelques pixels (accepté). |
| L9-F1-6 | Montée des lignes (P5) : « ? ! : ; » et « » » restent attachés à leur mot ; `scroll-padding-top: var(--header-h)` (Lenis compris) ; l'alias `asphalt-grain` est retiré. | Aucun signe seul en début de ligne ; une ancre ne passe plus sous l'en-tête. |
| L9-F2-1 | Une seule composition de la coque, `PublicShell`, pour le layout public et la 404 d'une adresse inconnue ; la 404 et l'erreur portent `data-calm="full"`. Phrase de la page d'erreur à partir de 768 px : « Le bouton Appeler en haut de l'écran fonctionne toujours. », seulement si le numéro est réglé. | WhatsApp n'est pas dans l'en-tête sur ordinateur (D.5) : l'ancienne phrase était fausse. |
| L9-F2-2 | Plaques : « PK 0X · » insécable, inscription trop longue repliée sous elle-même en retrait ; pictogramme au trait (`pictogramStyle`, `auto` par défaut) quand la section contient déjà le bouton jaune (`PrimaryLink` porte `data-primary`). | Un seul aplat jaune par écran (B.1). |
| L9-F2-3 | Mot composé jamais coupé au trait d'union dans les titres (`keepWord`) ; le titre réduit sa taille juste assez pour que le mot tienne (`HeadingFit`). `OpeningShot` reçoit `titleFit` et `stage="tall"`. | « INTERVENONS- / NOUS » ; titres de quatre lignes à 1 024 × 768. |
| L9-F2-4 | `RelatedFaq` : titre et lien « Toutes les questions » en tête, questions numérotées sur toute la largeur. Menu mobile resserré sous 790 px de haut (lignes de 48 px), seule la liste défile au-dessous. `RoadLine` s'efface au pied de page sur ordinateur. À 320 px : devise de l'en-tête resserrée, barre d'action en trois colonnes égales. | Aucune colonne vide ; tout le menu tient dans 390 × 664. |
| L9-F2-5 | `ToComplete` porte la bordure de chantier à chevrons ; un marqueur court (12 caractères au plus) ne se coupe jamais. | F.9 ; l'alias local des pages légales est retiré (L9-F6-6). |
| L9-F3-1 | **Décision : les illustrations du kit et le décor de base sont des composants clients** (`TowTruck`, `CarSide`, glyphes, `RoutePaths`, `HighwayRelay`, `ThreeLegs`, `PlanIdf`, `Depot`, `StreetLamps`). Leurs props restent sérialisables ; `plan-idf.tsx` réexporte les outils du repère, utilisables côté serveur. | Budget de la charge RSC (G.2) : un composant serveur répète son balisage SVG dans la charge RSC. Accueil en production : 690 → 476 Ko de HTML brut, 97 → 69 Ko compressés, 443 → 241 Ko de charge RSC, 2 803 → 2 345 nœuds. Coût : environ 16,5 Ko compressés de JavaScript, mis en cache d'une page à l'autre. Les budgets de 40 Ko et 1 500 nœuds de l'accueil ne sont pas encore atteints (fenêtres de la rue, classes, icônes, coque). |
| L9-F3-2 | Nouvelles options : `PlanIdf` `static`, `detail="low"`, `underlay` (calques sous les communes et le losange) ; noms des communes jamais hors du cadre ; `DirectionSign` `size="compact"` et titre ajusté (12 px au moins) ; `InfoPlaque` `layout="inline"` ; `EstimateTicket` `compact` et `linesSummary` (`<details>`, sans JavaScript) ; `StreetLamps` `ignite` et `data-lamp` ; `Depot` `--depot-duration` et `data-depot-shutter` ; `Voyant` sans `!important`. | Demandes des lots de pages : chaque page abandonne ses contournements locaux. |
| L9-F3-3 | Boucles du kit (feux de détresse, gyrophare, roues, onde du dépôt, balayage du plan) : classe `.loop`, arrêtées sans `html.motion-ready`, sauf dans un ancêtre `[data-loops-nojs]`. | C.3 : sans JavaScript, seules les boucles des ouvertures tournent. |
| L9-F3-4 | La voiture chargée sur la dépanneuse est celle du client (`CarSide` de profil, `CarTopGlyph` vu de dessus) ; jaune de la dépanneuse et du dépôt lu sur le jeton (`currentColor`). Ticket compact : une colonne en 17 px sur téléphone, deux à partir de 640 px ; espaces insécables dans les lignes. | On reconnaît la même voiture d'une scène à l'autre (J.3) ; A7. |
| L9-F5-1 | Tests de recette `urgence.spec.ts` et `immersion.spec.ts`, projet Playwright `desktop` (1 440 × 900) en plus de `mobile` ; `parcours.spec.ts` inchangé. | Voir les règles durables ci-dessus. |
| L9-F6-1 | /contact : plan du dépôt `PlanIdf static` (la règle locale qui coupait toutes les animations du plan est retirée) ; pictogramme au trait sur la plaque PK 00 ; colonne des coordonnées bornée à l'écran (le marqueur « À COMPLÉTER : email » passe sous sa pastille à 320 px) ; ouverture coupée en largeur (borne à 1 024 px). | Débordements horizontaux de 6 px à 320 px et de 1 px à 1 024 px ; un seul aplat jaune (puits d'appel et bouton de l'en-tête). |
| L9-F6-2 | /zones-d-intervention : surfaces, ondes, halos des communes et trajets passent en `underlay` du plan (sous les noms et le losange du dépôt) ; points allumés et dépanneuse restent au-dessus (la dépanneuse, sortie du trajet, reste cachée tant qu'aucun secteur n'est allumé). Les lampadaires du panneau de localité s'allument par `data-lamp` et `--lamp-i`, plus par l'ordre des éléments. L'ouverture garde sa propre carte (pas d'`OpeningShot stage="tall"`). | Les noms des communes restent lisibles quand une zone s'allume ; la carte d'ouverture est en pleine largeur sous le texte, inclinée, avec sa parallaxe et son bouton pause, ce que `OpeningShot` ne prévoit pas. |
| L9-F6-3 | /entreprise : `OpeningShot titleFit` remplace le titre local (mêmes valeurs) ; rideau du dépôt par `--depot-duration: 1.2s` ; section des engagements coupée en largeur. /depannage et /remorquage gardent leur taille de titre locale : `titleFit` (12,6 vw sur téléphone) réduirait de 18 à 21 % un titre court qui tient déjà ; seul le contournement `:has(> .openFrame)` est retiré (le socle laisse la marge de découpe). | Débordement de 32 px à 1 024 × 768 (faisceau des engagements). |
| L9-F6-4 | /demande, étape Prix sous 1 024 px : ticket `compact`, lignes repliées sous « Voir le détail » ; la feuille de route repliée passe sous les actions. « Demander le dépannage » à 643–707 px à 390 × 844 (au lieu de 975–1 039) et à 665–729 px à 320 × 700. De 1 024 à 1 279 px : ticket de 19rem, bouton sur deux lignes au besoin (hauteur libre), noms des bornes paires de la route des étapes une ligne plus bas, en quinconce. | Le bouton entre dans le premier écran (U3) ; « Prix » et « Coordonnées » se chevauchaient à 1 024 × 768, et le texte du bouton débordait sur trois lignes. Remplace L7-6 pour le téléphone. |
| L9-F6-5 | Ouvertures de /depannage, /remorquage, /entreprise, /questions-frequentes, /zones-d-intervention et /panne-autoroute : `data-loops-nojs` sur la scène. | C.3 (voir L9-F3-3). |
| L9-F6-6 | Pages légales : `ToComplete` importé du socle, alias `Chantier` retiré. | Un seul marqueur « À COMPLÉTER » dans le code. |
| L9-F6-7 | /panne-autoroute, PK 02 : la taille du titre « Votre véhicule est sorti de l'autoroute ? » est bornée par sa colonne (`100cqi / 6,2`, « L'AUTOROUTE ? » insécable). /zones-d-intervention sous 360 px : vignette des secteurs de 5,25rem. Sous 360 px encore : le bouton jaune des ouvertures (/depannage, /remorquage, /entreprise, /questions-frequentes) se resserre (marges et texte), et le titre des thèmes de /questions-frequentes est borné par la place à côté de son panneau, réduit à 2,75rem. | À 1 024 et 1 440 px, « L'AUTOROUTE ? » débordait sur la scène (146 px à 1 024) ; à 320 px, « arrondissements » touchait le bord de la plaque, le bouton jaune des ouvertures dépassait l'écran de 9 à 19 px (coupé) et « L'INTERVENTION » était coupé par le bord. |
