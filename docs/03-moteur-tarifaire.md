# 03 — Moteur tarifaire

> Version 1.0 du 04/10/2026 : mécanique appliquée dans `src/core/pricing` (ordre des étapes : `pipeline.ts`), couverte par les tests.
>
> ⚠️ **Toutes les valeurs chiffrées de ce document sont fictives.** Elles servent à illustrer la mécanique. Les valeurs installées au départ sont dans [05 — Réglages administrables](05-reglages-administrables.md).

## 1. Principes

1. **Deux comptes séparés.**
   - **Prix client** : ce que RNB AUTO facture.
   - **Coût interne** : ce que l'intervention coûte réellement à RNB AUTO.
   - **Marge** = prix hors taxes − coût interne.
2. **Fonction pure** : `calculer(entrées, contexte, réglages) → résultat détaillé`. Avec les mêmes entrées et les mêmes réglages, le résultat est toujours identique. Aucun accès à la base de données ni au réseau.
3. **Aucune valeur commerciale dans le moteur.** Il ne contient que des mécanismes : sans réglages, il ne peut rien calculer.
4. **Une chaîne d'étapes déclarée dans une liste unique.** Chaque étape est une petite fonction qui lit l'état du calcul et ajoute des **lignes** au résultat. Changer l'ordre ou ajouter une étape revient à modifier cette liste (et ses tests), sans toucher aux autres étapes. Il n'y a pas de grande fonction remplie de conditions.
5. **Tout est expliqué.** Chaque ligne indique la règle appliquée, son calcul (« 45 km × 2,00 € ») et qui peut la voir (client ou admin).

## 2. Les trois trajets

```
          ① ALLER À VIDE               ② VÉHICULE CHARGÉ              ③ RETOUR À VIDE
DÉPÔT ─────────────────────► CLIENT ─────────────────────► DESTINATION ─────────────────────► DÉPÔT
(Bobigny)                    (Cergy)                       (Montreuil)                        (Bobigny)
```

| | Trajet | Facturation au client | Coût interne |
|---|---|---|---|
| ① | Dépôt → client | réglable : activé ou non, prix/km « dépanneuse vide » | toujours compté, consommation à vide |
| ② | Client → destination | réglable : activé ou non, prix/km « véhicule chargé » | toujours compté, consommation en charge |
| ③ | Destination → dépôt | réglable : activé ou non, prix/km « retour à vide » | toujours compté, consommation à vide |

- **Dépannage sur place** (sans transport) : il n'y a pas de trajet ②, et le retour ③ part du lieu de la panne.
- Le **dépôt** est un réglage (Paramètres → Entreprise → Adresse de départ), géocodé à l'enregistrement. Tous les calculs suivants l'utilisent ; les estimations passées gardent l'ancien.
- Les trois trajets entrent **toujours** dans le coût interne, même si l'un d'eux n'est pas facturé : la marge affichée reste juste.
- Évolution prévue : le point de départ pourra être la position réelle de la dépanneuse (réglage « point de départ du calcul »).

## 3. Ordre des étapes

### 3.1 Vue d'ensemble

```
ENTRÉES    adresse ou position du client · destination (ou sur place) · véhicule · situation(s) · moment

0. CONTEXTE (aucun prix)
   version des tarifs en vigueur · dépôt · date et heure à Paris · jour férié ? · plage horaire
   · prix du carburant et sa source · 3 trajets : km, durée, fournisseur

── COÛT INTERNE (calculé en premier : il ne dépend pas du prix) ─────────────────────
   carburant · usure et entretien · amortissement · frais par intervention · temps
   = COÛT INTERNE ESTIMÉ (HT)

── PRIX CLIENT ───────────────────────────────────────────────────────────────────────
1. TRAJETS           chaque trajet activé : (km − km offerts) × prix/km
2. PRIX DE BASE      prise en charge + trajets + frais fixes
3. CARBURANT         indexation de la part kilométrique (si activée)
4. SUPPLÉMENTS       véhicule, situations, règles personnalisées (€ ou % du prix de base)
                     = PRESTATION COMPLÈTE
5. MAJORATIONS       plages horaires, jours, jours fériés, avec règles de cumul
                     (€ ou % de la prestation complète)
6. REMISES AUTO      (prévu : clients professionnels, codes promotionnels)
                     = PRIX CALCULÉ
7. ARRONDI           aucun / à l'euro / aux 5 € / aux 10 € ; au plus proche ou toujours au-dessus
8. PRIX MINIMUM      prix = le plus élevé entre le prix et le minimum
9. RENTABILITÉ       si prix HT < coût interne + marge minimale : relever, alerter ou ne pas afficher de prix
                     = ESTIMATION CLIENT (TTC et HT)

── SUR UNE INTERVENTION (admin) ──────────────────────────────────────────────────────
10. AJUSTEMENTS      suppléments ou remises, en € ou en %, motif obligatoire ; nouvel arrondi (réglable)
11. CONTRÔLES        minimum et marge vérifiés de nouveau : avertissements, jamais de blocage
                     = PRIX CONFIRMÉ

    MARGE = prix HT − coût interne
```

### 3.2 Pourquoi cet ordre

| Choix | Raison |
|---|---|
| Contexte et coût interne avant le prix | le coût ne dépend pas du prix, et il est nécessaire au contrôle de rentabilité |
| Indexation du carburant juste après les trajets | elle ne concerne que la part kilométrique, la plus sensible au prix du gazole |
| Suppléments avant majorations | une majoration de nuit porte sur toute la prestation, suppléments compris (réglable règle par règle) |
| Pourcentages non multipliés entre eux | nuit +20 % et dimanche +20 % donnent +40 % de la même base, pas +44 % : c'est plus prévisible |
| **Arrondi avant le minimum** (écart par rapport à l'ordre conceptuel du cahier des charges) | si l'on arrondissait après, un minimum de 45 € avec un arrondi aux 10 € deviendrait 50 € : le minimum choisi ne serait plus respecté à l'euro près (exemple 3, §17) |
| Minimum, puis rentabilité | ce sont deux planchers : le montant final est le plus élevé des deux. L'ordre décide seulement lequel est affiché comme « appliqué » |
| Ajustements manuels en dernier | ils portent sur une intervention réelle et ne modifient jamais les règles |

L'ordre est déclaré une seule fois dans le code :

```ts
export const PRICE_PIPELINE = [
  legsStage,               // 1. trajets
  baseStage,               // 2. prix de base
  fuelIndexationStage,     // 3. carburant
  supplementsStage,        // 4. suppléments
  calendarStage,           // 5. majorations
  automaticDiscountsStage, // 6. remises automatiques
  roundingStage,           // 7. arrondi
  minimumStage,            // 8. prix minimum
  profitabilityStage,      // 9. rentabilité
  vatStage,                //    TTC / HT
] as const;
```

## 4. Entrées et contexte

```ts
type GeoPoint = { lat: number; lng: number };

/** Ce que fournit le client (ou l'admin). */
type QuoteInput = {
  pickup: GeoPoint & { address: string; handoverAfterRegulatedRoad: boolean };
  dropoff: { kind: 'address'; point: GeoPoint; address: string } | { kind: 'on_site' };
  vehicleCategory: string;        // code interne, ex. 'suv'
  situations: string[];           // codes internes, ex. ['non_rolling']
  requestedFor: { kind: 'asap' } | { kind: 'scheduled'; at: string }; // ISO 8601
};

/** Ce que le serveur résout avant d'appeler le moteur. */
type QuoteContext = {
  computedAt: string;
  local: {                        // heure de Paris
    date: string;                 // '2026-10-04'
    time: string;                 // '23:00'
    isoWeekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    publicHoliday: string | null; // ex. 'Toussaint'
  };
  depot: GeoPoint & { id: string; address: string };
  legs: { emptyOut: Leg; loaded: Leg | null; emptyBack: Leg };
  fuel: {
    priceTtcMillisPerLiter: number; // 1,829 €/L → 1829
    source: 'auto' | 'last_known' | 'manual';
    observedAt: string;
    origin: string;               // ex. 'médiane de 14 stations à moins de 10 km du dépôt'
  };
};

type Leg = { distanceMeters: number; durationSeconds: number; provider: string; fromCache: boolean };
```

## 5. Anatomie d'une règle

Toutes les règles activables (trajets, frais, véhicules, situations, horaires, jours, coûts internes, règles personnalisées) suivent **le même modèle**.

| Élément | Exemple | Affiché dans l'admin |
|---|---|---|
| Identifiant | `7f3c…` | non |
| Code interne | `calendar.sunday` | non |
| Nom | « Dimanche » | oui |
| Aide | « Appliquée toute la journée du dimanche. » | oui |
| Catégorie | jour | oui (rubrique) |
| Compte | prix client / coût interne | implicite |
| Activée | oui / non | interrupteur |
| Effet | supplément / remise | oui |
| Calcul | montant fixe, pourcentage, prix par km, prix par heure | oui |
| Calculé sur | prix de base / prestation complète / estimation | mode avancé |
| Conditions | « jour = dimanche » | oui, en phrase |
| Groupe de cumul | « jours » | mode avancé, en question simple |
| Priorité | 10 | mode avancé (« ordre d'application ») |
| Visible par le client | oui, sous le nom « Majoration dimanche » | oui |
| Règle fournie | oui : désactivable mais pas supprimable | non |
| Dates, auteur | créée le…, modifiée le… par… | historique |

```ts
type PricingRule = {
  id: string;
  code: string;
  label: string;
  help?: string;
  category:
    | 'leg' | 'pickup_fee' | 'fixed_fee'      // prix de base
    | 'vehicle' | 'situation' | 'custom'      // suppléments
    | 'time_slot' | 'day' | 'holiday'         // majorations de calendrier
    | 'discount'                              // remises automatiques
    | 'internal_cost';                        // coûts internes
  ledger: 'client_price' | 'internal_cost';
  enabled: boolean;
  effect: 'add' | 'subtract';
  calculation: Calculation;
  conditions: Condition[];         // toutes doivent être vraies ; liste vide = toujours
  priority: number;                // ordre à l'intérieur de son étape
  clientVisible: boolean;
  clientLabel?: string;
  system: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

type LegKey = 'emptyOut' | 'loaded' | 'emptyBack';

type Calculation =
  | { kind: 'fixed'; amountCents: number }
  | { kind: 'percent'; rateBp: number; base: 'base_price' | 'full_service' | 'estimate' }
  | { kind: 'per_km'; centsPerKm: number; legs: LegKey[]; freeKm: number }
  | { kind: 'per_hour'; centsPerHour: number; includeHandlingTime: boolean }
  | { kind: 'fuel' };              // coût du carburant : litres consommés × prix du litre
```

Exemples de règles fournies :

| Code | Catégorie | Calcul |
|---|---|---|
| `leg.empty_out` | trajet | €/km sur ① |
| `leg.loaded` | trajet | €/km sur ② |
| `leg.empty_back` | trajet | €/km sur ③ |
| `fee.pickup` | prise en charge | montant fixe |
| `vehicle.suv` | véhicule | fixe ou %, condition « véhicule = SUV » |
| `situation.non_rolling` | situation | fixe ou %, condition « situation = non roulant » |
| `calendar.night` | plage horaire | %, condition « entre 22:00 et 06:00 » |
| `calendar.sunday` | jour | %, condition « jour = dimanche » |
| `calendar.holiday` | jour férié | %, condition « jour férié » |
| `cost.fuel` | coût interne | carburant |
| `cost.wear` | coût interne | €/km, tous les trajets |
| `cost.depreciation` | coût interne | €/km, tous les trajets |
| `cost.overhead` | coût interne | montant fixe par intervention |
| `cost.time` | coût interne | €/heure, temps de manœuvre inclus |

## 6. Conditions disponibles

Les conditions viennent d'une **liste fermée**. Il n'y a ni formule libre ni code exécuté. C'est ce qui permettra plus tard à l'admin de **créer ses propres règles** en toute sécurité, par exemple « Supplément véhicule très bas : quand cette option est cochée, +15 € ».

```ts
type Condition =
  | { type: 'time_between'; start: string; end: string }   // '22:00' → '06:00' : passe minuit
  | { type: 'weekday_in'; days: (1 | 2 | 3 | 4 | 5 | 6 | 7)[] }
  | { type: 'public_holiday' }
  | { type: 'vehicle_in'; categories: string[] }
  | { type: 'situation_any'; codes: string[] }
  | { type: 'distance'; leg: LegKey | 'total'; operator: 'gt' | 'lte'; km: number }
  | { type: 'service_kind'; kind: 'tow' | 'on_site' }
  | { type: 'pickup_postcode_in'; postcodes: string[] };   // ex. Paris intra-muros
```

Règles de calcul du calendrier :

- les heures sont celles de **Paris** ; les jours de changement d'heure sont gérés ;
- plage horaire : début inclus, fin exclue (22:00 compte comme la nuit, 06:00 non) ;
- heure de référence : **heure de la demande** (proposition) ou heure d'arrivée estimée (réglage) ;
- jours fériés nationaux **calculés automatiquement** chaque année : 1er janvier, lundi de Pâques, 1er mai, 8 mai, Ascension, lundi de Pentecôte, 14 juillet, 15 août, 1er novembre, 11 novembre, 25 décembre. Chacun peut être désactivé, et l'admin peut ajouter des dates.

## 7. Cumul des majorations

Chaque majoration de calendrier appartient à un **groupe**. Chaque groupe a une politique : « la plus élevée seulement » ou « s'additionnent ».

| Groupe | Contenu | Proposition par défaut |
|---|---|---|
| Jours | lundi … dimanche, jour férié | **la plus élevée** : un jour férié qui tombe un dimanche ne compte pas deux fois |
| Plages horaires | nuit, soirée… | **la plus élevée** : deux plages qui se chevauchent ne s'additionnent pas |
| Jours + plages | combinaison des deux groupes | **s'additionnent** : nuit + dimanche |

Dans l'admin, cela prend la forme de deux questions simples :

- « Si c'est à la fois un dimanche et un jour férié : (•) appliquer seulement la plus élevée ( ) additionner »
- « La majoration de nuit s'ajoute-t-elle à celle du dimanche ou d'un jour férié ? (•) Oui ( ) Non, appliquer seulement la plus élevée »

Les pourcentages d'un même étage sont tous calculés sur **la même base**. Ils ne se multiplient pas.

## 8. Carburant

### 8.1 Coût du carburant (coût interne)

```
litres = (km à vide × consommation à vide + km chargés × consommation en charge) / 100
coût   = litres × prix du litre HT        (prix TTC ramené en HT selon la TVA récupérable)
```

Prix du litre :

- **mode manuel** : la valeur saisie par l'admin ;
- **mode automatique** : données officielles « prix des carburants », soit la médiane des stations proches du dépôt, soit une station choisie ;
- **repli** : dernière valeur valide, et si elle est trop ancienne, valeur manuelle. Le calculateur n'est jamais bloqué.
- L'admin voit : « Dernière mise à jour : 03/10/2026 à 14:20 · Source : … · [Actualiser maintenant] ».

### 8.2 Impact du carburant sur le prix client (indexation, facultative)

```
facteur = 1 + part du carburant × (prix actuel − prix de référence) / prix de référence
          (limité à ± plafond)
part kilométrique du prix × facteur
```

Exemple fictif : prix de référence 1,80 €/L, prix actuel 1,98 €/L (+10 %), part du carburant 30 % : les montants kilométriques augmentent de 3 %.

L'admin voit une phrase calculée en direct : *« Si le carburant coûte 10 % de plus que votre prix de référence, vos prix au kilomètre augmentent de 3 %. »*

## 9. Coûts internes

| Poste | Unité | Remarque |
|---|---|---|
| Carburant | calculé | voir §8.1 |
| Usure et entretien estimés | €/km | une valeur globale, ou le détail en mode avancé : pneus, freins, vidanges, entretien |
| Amortissement de la dépanneuse | €/km | |
| Assurance et frais généraux | € par intervention | |
| Temps | €/heure | durée de conduite des 3 trajets + temps de chargement et déchargement |
| Autres frais | €/km ou € par intervention | liste libre |

Les coûts internes sont des règles du compte « coût interne ». Ils utilisent les mêmes mécanismes (activée, valeur, unité) mais ne sont **jamais montrés au client**.

## 10. Marge et garde-fous

- **Marge** = prix HT − coût interne. **Taux de marge** = marge ÷ prix HT.
- **Marge minimale** (€ HT) et **marge visée** (%) servent aux indicateurs :

| Indicateur | Condition |
|---|---|
| 🟢 Rentable | marge ≥ marge visée |
| 🟠 Marge faible | marge minimale ≤ marge < marge visée |
| 🔴 Marge très faible | 0 ≤ marge < marge minimale |
| ⛔ Vendue à perte | marge < 0 |

- Pour les **estimations automatiques** (site, simulateur), un réglage décide quoi faire si la marge minimale n'est pas atteinte :
  - **relever** le prix jusqu'au seuil, arrondi vers le haut (proposition) ;
  - **alerter seulement** ;
  - **ne pas afficher de prix** au client : demande « sur devis », rappel.
- Pour les **ajustements manuels** de l'admin : avertissements, et confirmation demandée en cas de perte. Jamais de blocage.

## 11. Prix minimum d'une intervention

- Réglage : activé / désactivé et montant. **45 €** est l'idée de départ ; la valeur reste modifiable.
- Effet : `prix = le plus élevé entre le prix arrondi et le minimum`.
- Le client voit seulement le prix final. L'admin voit la ligne « Prix minimum appliqué (calcul : 31,70 €) ».
- Un ajustement manuel qui passe sous le minimum est autorisé, avec avertissement (proposition à valider).

## 12. Arrondi

| Réglage | Choix |
|---|---|
| Arrondir le prix | activé / désactivé |
| Précision | à l'euro · aux 5 € · aux 10 € |
| Sens | au plus proche · toujours au-dessus |
| Arrondir aussi après un ajustement manuel | oui / non |

Exemples : 87,13 € arrondi à l'euro au plus proche donne 87 € ; 87,13 € arrondi aux 10 € donne 90 € ; 84 € arrondi aux 10 € donne 80 € au plus proche, ou 90 € « toujours au-dessus ».

Chaque ligne intermédiaire est arrondie au centime (arrondi commercial) ; c'est l'arrondi final qui suit ce réglage.

## 13. TVA

- Réglages : entreprise soumise à la TVA (oui/non), taux, **prix saisis TTC ou HT**, part de TVA récupérable sur le carburant.
- Les prix affichés aux particuliers sont **TTC**.
- La marge est toujours calculée **hors taxes**, à partir de coûts internes saisis hors taxes.
- Si l'entreprise n'est pas soumise à la TVA, HT = TTC et la mention adaptée figure sur les documents.

## 14. Ajustements manuels

```ts
type ManualAdjustment = {
  effect: 'supplement' | 'discount';
  mode: 'amount' | 'percent';
  value: number;          // centimes ou points de base
  reason: string;         // obligatoire : « Client régulier », « Accès difficile »…
  createdBy: string;
  createdAt: string;
};
```

- Les pourcentages portent sur l'**estimation client**. Ils ne se multiplient pas entre eux.
- Raccourci « **Fixer le prix final** » : l'admin tape le prix voulu, et le système enregistre l'écart comme un ajustement avec motif.
- Nouvel arrondi selon le réglage, puis contrôles : minimum et marge, sous forme d'avertissements.
- Les ajustements appartiennent à l'intervention. Ils ne modifient jamais les règles.

## 15. Résultat : vue client et vue admin

```ts
type QuoteLine = {
  stage: string;
  code: string;
  ruleId?: string;
  label: string;            // libellé admin
  clientLabel?: string;     // libellé client, si visible
  amountCents: number;      // négatif pour une remise
  detail?: string;          // « 45 km × 2,00 € »
  ledger: 'client_price' | 'internal_cost';
  visibility: 'client' | 'admin';
};

type QuoteResult = {
  lines: QuoteLine[];
  client: {
    priceTtcCents: number | null;   // null : prix non affiché (hors zone, sur demande, non rentable…)
    includedLabels: string[];
    vehicleTripKm: number | null;   // distance utile : trajet du véhicule
  };
  admin: {
    km: { emptyOut: number; loaded: number; emptyBack: number; total: number };
    basePriceCents: number;
    computedPriceCents: number;     // avant arrondi
    roundedPriceCents: number;
    minimumApplied: boolean;
    profitabilityApplied: boolean;
    priceHtCents: number;
    priceTtcCents: number;
    internalCost: {
      fuelLiters: number;
      fuelCents: number;
      perKmCents: number;
      perInterventionCents: number;
      timeCents: number;
      totalCents: number;
    };
    marginCents: number;
    marginRateBp: number;
    marginLevel: 'ok' | 'below_target' | 'below_minimum' | 'loss';
    warnings: string[];             // ex. 'FUEL_PRICE_FALLBACK', 'DEMO_SETTINGS', 'OUT_OF_ZONE'
  };
  meta: { configVersion: number; engineVersion: string; computedAt: string };
};
```

Le serveur ne renvoie au navigateur du client que la partie `client`.

## 16. Simulateur « Tester mes tarifs »

- **Saisie** : départ du client, destination (ou sur place), jour, heure, véhicule, situation(s). En mode avancé, on peut aussi imposer un prix du carburant ou des kilomètres.
- **Résultat** : le détail complet, dans le format du cahier des charges (voir exemple 1 ci-dessous).
- **Essai sans enregistrer** : changer une valeur pour voir son effet, avant/après côte à côte (« Avec vos tarifs : 270 € · Avec l'essai : 290 € »).
- **Trajets de référence** : enregistrer des simulations types. Elles servent à l'aperçu d'impact affiché à chaque modification de tarif.
- **Créer une intervention** à partir de ce calcul (saisie pendant un appel).

## 17. Exemples chiffrés (valeurs fictives)

> Ces exemples illustrent le mécanisme avec des valeurs fictives, choisies pour être faciles à suivre. Les valeurs réellement installées au départ (moyennes du marché francilien) sont listées dans [05 — Réglages administrables](05-reglages-administrables.md), §3 ; « Tester mes tarifs » donne le détail exact pour n'importe quel trajet.

Réglages fictifs utilisés :

| Réglage | Valeur fictive |
|---|---|
| Prise en charge | 30,00 € |
| ① Déplacement jusqu'au client | 1,00 €/km |
| ② Véhicule chargé | 2,00 €/km |
| ③ Retour au dépôt | 0,50 €/km |
| SUV | +10,00 € |
| Véhicule non roulant | +20,00 € |
| Nuit (22:00 → 06:00) | +20 % de la prestation complète |
| Dimanche | +20 % de la prestation complète |
| Cumul nuit + dimanche | oui |
| Arrondi | aux 5 €, toujours au-dessus |
| Prix minimum | 45,00 € |
| TVA | 20 %, prix saisis TTC |
| Consommation | 14 L/100 km à vide, 17 L/100 km en charge |
| Carburant | 1,80 €/L TTC, soit 1,50 €/L HT |
| Usure et entretien | 0,15 €/km |
| Amortissement | 0,10 €/km |
| Frais par intervention | 5,00 € |
| Temps | 25,00 €/h, plus 30 min de chargement et déchargement |
| Marge minimale | 5,00 € HT |
| Marge visée | 30 % |

Distances illustratives (en réel, elles viennent du service d'itinéraire).

### Exemple 1 — Dimanche 23:00, SUV non roulant, Cergy → Montreuil

```
TRAJETS
Dépôt → Cergy (à vide)               38 km · 40 min
Cergy → Montreuil (chargé)           45 km · 50 min
Montreuil → dépôt (à vide)            8 km · 15 min
Kilométrage total                    91 km · 1 h 45

PRIX CLIENT
Prise en charge                                       30,00 €
Déplacement jusqu'au client     38 km × 1,00 €        38,00 €
Trajet avec véhicule chargé     45 km × 2,00 €        90,00 €
Retour au dépôt                  8 km × 0,50 €         4,00 €
Prix de base                                         162,00 €
Supplément SUV                                       +10,00 €
Véhicule non roulant                                 +20,00 €
Prestation complète                                  192,00 €
Majoration nuit         20 % de 192,00 €             +38,40 €
Majoration dimanche     20 % de 192,00 €             +38,40 €
Prix calculé                                         268,80 €
Arrondi (aux 5 €, au-dessus)                         270,00 €
Prix minimum (45,00 €)                          non concerné
Rentabilité                                               OK
PRIX ESTIMÉ CLIENT                        270,00 € TTC · 225,00 € HT

COÛT INTERNE (HT)
Carburant   (46 km × 14 L + 45 km × 17 L) / 100 = 14,09 L × 1,50 €   21,14 €
Usure et entretien           91 km × 0,15 €                          13,65 €
Amortissement                91 km × 0,10 €                           9,10 €
Frais par intervention                                                5,00 €
Temps                        2 h 15 × 25,00 €                        56,25 €
COÛT INTERNE ESTIMÉ                                                 105,14 €

MARGE ESTIMÉE                 225,00 € − 105,14 € = 119,86 € HT (53 %)   🟢
```

### Exemple 2 — Mardi 10:00, batterie à Drancy, sans transport

```
Dépôt → Drancy (à vide)          4 km · 10 min
Drancy → dépôt (à vide)          4 km · 10 min

Prise en charge                                   30,00 €
Déplacement jusqu'au client      4 km × 1,00 €     4,00 €
Retour au dépôt                  4 km × 0,50 €     2,00 €
Prix calculé                                      36,00 €
Arrondi (aux 5 €, au-dessus)                      40,00 €
Prix minimum appliqué                             45,00 €
PRIX ESTIMÉ CLIENT                   45,00 € TTC · 37,50 € HT

Coût interne : carburant 1,68 € + usure 1,20 € + amortissement 0,80 €
             + frais 5,00 € + temps (50 min) 20,83 €          = 29,51 €
Marge estimée : 37,50 € − 29,51 € = 7,99 € HT (21 %)                🟠 sous la marge visée
```

### Exemple 3 — Pourquoi l'arrondi passe avant le minimum

Prix calculé 36,00 €, arrondi **aux 10 €, au-dessus**, minimum 45 € :

| Ordre | Calcul | Résultat |
|---|---|---|
| Arrondi puis minimum (proposé) | 36,00 → 40,00 → minimum 45,00 | **45,00 €** : le minimum est respecté exactement |
| Minimum puis arrondi | 36,00 → 45,00 → arrondi 50,00 | 50,00 € : le minimum choisi n'est plus le vrai minimum |

## 18. Photographies et versions de tarifs

- Chaque enregistrement dans « Mes tarifs » crée une **version de tarifs** numérotée et non modifiable (date, auteur, résumé des changements).
- Chaque estimation enregistre sa **photographie** :
  - les entrées ;
  - le contexte : distances et fournisseur, prix du carburant et sa source, heure locale, jour férié ;
  - le numéro de version des tarifs et une copie complète des réglages utilisés ;
  - la version du moteur ;
  - toutes les lignes du résultat.
- Une estimation n'est **jamais recalculée automatiquement**. « Recalculer » est une action explicite qui crée une nouvelle révision ; l'ancienne reste visible.
- « Revenir à une version » crée une nouvelle version identique à l'ancienne : l'historique n'est jamais réécrit.

## 19. Tests

- **Tests par étape** : chaque étape est testée seule.
- **Scénarios de référence** : réglages fixes + entrées fixes → résultat exact attendu, ligne par ligne. Les exemples ci-dessus en font partie.
- **Cas limites** : 21:59, 22:00, 05:59 et 06:00 ; passage de minuit ; jours de changement d'heure ; jours fériés calculés (Pâques, Ascension, Pentecôte) ; férié un dimanche ; 0 km ; dépannage sur place ; tous les trajets désactivés ; minimum désactivé ; chaque mode d'arrondi ; remise supérieure au prix (plancher à 0 €) ; très longues distances.
- **Propriétés vérifiées automatiquement** :
  - une estimation automatique n'est jamais sous le minimum quand il est activé ;
  - mêmes entrées → même résultat ;
  - désactiver un supplément ne fait jamais monter le prix ;
  - la somme des lignes est égale au total.
- **Contrôle automatique** : aucune valeur commerciale chiffrée dans le code du moteur.
