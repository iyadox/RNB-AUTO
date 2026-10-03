# 05 — Réglages administrables

> Document de cadrage, version 0.1 du 03/10/2026.
>
> ⚠️ Les valeurs de la colonne « Démo » sont **fictives**. Elles rendent le système compréhensible dès l'installation et ne sont **pas** des tarifs RNB AUTO. Seul le prix minimum de 45 € vient du cahier des charges, comme idée de départ.

## 1. Comment on garantit que tout se règle sans code

1. **Aucune valeur commerciale dans le code.** Le moteur ne contient que des mécanismes et ne peut pas calculer sans recevoir les réglages. Un contrôle automatique signale toute valeur chiffrée glissée dans le code du moteur.
2. **Un registre unique des réglages.** Chaque réglage y est décrit une seule fois : nom français, aide, unité, bornes, niveau (simple ou avancé), valeur de démonstration. À partir de ce registre sont produits automatiquement :
   - le champ dans l'écran d'administration ;
   - la validation côté navigateur **et** côté serveur ;
   - le libellé dans l'historique des modifications.

   Un réglage absent du registre ne peut pas exister : impossible d'avoir une valeur utilisée par le moteur sans qu'elle soit modifiable.
3. **Des règles en base plutôt que des conditions dans le code.** Ajouter un type de véhicule, une situation, une plage horaire, un jour férié ou un frais fixe revient à ajouter une ligne depuis l'admin.
4. **Des valeurs de démonstration bien identifiées.** À l'installation, tout est rempli avec des valeurs « DÉMO ». Un bandeau le rappelle, et l'**estimation en ligne reste désactivée** tant que l'écran « Vos tarifs sont-ils prêts ? » n'est pas validé, section par section.
5. **Modifier sans risque.**
   - Confirmation avec aperçu d'impact sur les trajets de référence.
   - Alertes sur les valeurs inhabituelles.
   - Bouton « Annuler » juste après l'enregistrement.
   - Historique complet et retour à une version précédente en un clic.
6. **Validation côté serveur** de chaque valeur, avec des messages en français simple.
7. **Le simulateur** montre immédiatement l'effet d'un réglage, avant même de l'enregistrer.

### Définition d'un réglage dans le registre

```ts
type SettingDefinition = {
  key: string;            // 'pricing_policy.minimumPrice.amountCents' (interne, jamais affiché)
  section: 'base' | 'schedule' | 'days' | 'vehicles' | 'situations' | 'fuel'
         | 'internal_costs' | 'margin' | 'rounding' | 'estimate' | 'company' | 'truck' | 'zone';
  label: string;          // « Prix minimum d'une intervention »
  help?: string;          // « Le client ne paiera jamais moins que ce montant. »
  input: 'toggle' | 'money' | 'percent' | 'money_or_percent' | 'money_per_km' | 'money_per_hour'
       | 'liters_per_100km' | 'km' | 'minutes' | 'time' | 'time_range' | 'choice' | 'address' | 'text';
  level: 'simple' | 'advanced';
  hardLimits?: { min?: number; max?: number };   // valeur refusée en dehors
  softLimits?: { min?: number; max?: number };   // confirmation demandée en dehors
  example?: (value: unknown) => string;          // « Exemple : 20 km = 20,00 € »
  demoValue: unknown;                            // valeur de démonstration, marquée DÉMO
};
```

## 2. Mode simple et mode avancé

Un sélecteur en haut de « Mes tarifs » : `[ Simple | Avancé ]`. Le mode simple est celui par défaut.

| Mode simple | Mode avancé : en plus |
|---|---|
| Prix minimum | Coûts internes, usure, amortissement, temps |
| Prise en charge, prix au km des 3 trajets | Marge minimale et marge visée, conduite à tenir si non rentable |
| Nuit et autres plages horaires | Arrondi |
| Jours et jours fériés | Cumul des majorations, base des pourcentages, ordre d'application |
| Véhicules | Kilomètres offerts, frais fixes |
| Situations | Impact du carburant (indexation), source et fréquence |
| Carburant : consommation et prix | Règles personnalisées |
| Adresse de départ (dépôt) | Options d'estimation en ligne, services externes |

## 3. Catalogue des réglages

### 3.1 Prix de base

| Libellé affiché | Saisie | Mode | Démo |
|---|---|---|---|
| Prix minimum d'une intervention | interrupteur + € | simple | activé, 45,00 € (idée de départ) |
| Prise en charge | interrupteur + € | simple | 30,00 € |
| Déplacement jusqu'au client (dépanneuse vide) | interrupteur + €/km | simple | 1,00 €/km |
| Trajet avec le véhicule chargé | interrupteur + €/km | simple | 2,00 €/km |
| Retour au dépôt (dépanneuse vide) | interrupteur + €/km | simple | 0,50 €/km |
| Kilomètres offerts, pour chaque trajet | km | avancé | 0 km |
| Frais fixes (liste : nom + montant) | interrupteur + € | avancé | aucun |

### 3.2 Horaires

| Libellé affiché | Saisie | Mode | Démo |
|---|---|---|---|
| Nuit | interrupteur, de [hh:mm] à [hh:mm], € ou %, valeur | simple | activé, 22:00 → 06:00, +20 % |
| Ajouter une plage horaire | nom, horaires, jours concernés, € ou %, valeur | simple | — |
| Heure prise en compte | heure de la demande / heure d'arrivée estimée | avancé | heure de la demande |

### 3.3 Jours

| Libellé affiché | Saisie | Mode | Démo |
|---|---|---|---|
| Lundi, mardi, mercredi, jeudi, vendredi, samedi | interrupteur, € ou %, valeur | simple | désactivés |
| Dimanche | interrupteur, € ou %, valeur | simple | activé, +20 % |
| Jours fériés | interrupteur, € ou %, valeur | simple | activé, +20 % |
| Liste des jours fériés | calendrier : chaque férié activable, ajout de dates | avancé | fériés nationaux calculés automatiquement |
| Dimanche et jour férié le même jour | la plus élevée / additionner | avancé | la plus élevée |
| La nuit s'ajoute au dimanche ou au férié | oui / non, la plus élevée | avancé | oui |

### 3.4 Véhicules

Pour chaque catégorie : **affiché au client** (oui/non), **accepté** (oui / sur demande / non), **supplément** (aucun, €, %).

| Catégorie | Démo |
|---|---|
| Petite citadine | acceptée, aucun supplément |
| Berline | acceptée, aucun supplément |
| Break | acceptée, aucun supplément |
| SUV | acceptée, +10,00 € |
| 4x4 | acceptée, +10,00 € |
| Utilitaire | acceptée, +15,00 € |
| Petit fourgon | acceptée, +20,00 € |
| Grand fourgon | sur demande |
| Autre | sur demande |

Bouton « Ajouter une catégorie ».

### 3.5 Situations et difficultés

Pour chaque situation : **activée**, **proposée au client** (oui) ou **ajoutée seulement par RNB AUTO** (non), **supplément** (aucun, €, %).

| Situation | Proposée au client | Démo |
|---|---|---|
| Véhicule roulant | oui | aucun supplément |
| Véhicule non roulant | oui | +20,00 € |
| Batterie | oui | aucun supplément |
| Crevaison | oui | aucun supplément |
| Panne mécanique | oui | aucun supplément |
| Accident | oui | +20,00 € |
| Roues bloquées | oui | +25,00 € |
| Véhicule dans un parking | oui | +15,00 € |
| Véhicule difficile à charger | non | +20,00 € |
| Treuillage | non | +30,00 € |
| Accès difficile | non | +15,00 € |
| Véhicule particulièrement lourd | non | +20 % |
| Autre | oui | aucun supplément |

Bouton « Ajouter une situation ».

### 3.6 Carburant

| Libellé affiché | Saisie | Mode | Démo |
|---|---|---|---|
| Consommation de la dépanneuse à vide | L/100 km | simple | 14 |
| Consommation avec un véhicule chargé | L/100 km | simple | 17 |
| Prix du carburant | automatique / manuel | simple | manuel (automatique en Phase 9) |
| Prix manuel du litre | €/L | simple | 1,80 € |
| Dernière mise à jour, source, [Actualiser maintenant] | affichage + bouton | simple | — |
| Carburant de la dépanneuse | choix | avancé | gazole |
| Prix automatique basé sur | station habituelle / moyenne des stations autour du dépôt (rayon) | avancé | moyenne à 10 km |
| Fréquence d'actualisation | choix | avancé | toutes les 6 heures |
| Si le prix automatique a plus de… | jours, puis prix manuel | avancé | 3 jours |
| Prix jugés aberrants | en dessous de… / au-dessus de… €/L | avancé | 1,00 € / 3,50 € |
| Impact du carburant sur le prix client | interrupteur, prix de référence, part du carburant, plafond | avancé | désactivé ; 1,80 € ; 30 % ; ±10 % |

### 3.7 Coûts internes *(avancé)*

| Libellé affiché | Saisie | Démo |
|---|---|---|
| Usure et entretien estimés (pneus, freins, vidanges…) | €/km | 0,15 €/km |
| Détailler l'usure (pneus, freins, vidanges, entretien) | €/km par poste ; remplace la valeur globale | désactivé |
| Amortissement de la dépanneuse | €/km | 0,10 €/km |
| Assurance et frais généraux | € par intervention | 5,00 € |
| Coût d'une heure de travail | €/h | 25,00 €/h |
| Temps de chargement et déchargement | minutes | 30 min |
| Autres frais (liste : nom + €/km ou € par intervention) | | aucun |
| TVA récupérable sur le carburant | % | 100 % (à confirmer avec le comptable) |

### 3.8 Marge *(avancé)*

| Libellé affiché | Saisie | Démo |
|---|---|---|
| Marge minimale par intervention | € HT | 5,00 € |
| Marge visée | % | 30 % |
| Si une estimation en ligne n'atteint pas la marge minimale | relever le prix / m'alerter seulement / ne pas afficher de prix | relever le prix (proposition) |

### 3.9 Arrondi *(avancé)*

| Libellé affiché | Saisie | Démo |
|---|---|---|
| Arrondir le prix client | interrupteur | activé |
| Précision | à l'euro / aux 5 € / aux 10 € | aux 5 € |
| Sens | au plus proche / toujours au-dessus | toujours au-dessus |
| Arrondir aussi après un ajustement manuel | interrupteur | activé |

### 3.10 Estimation en ligne *(avancé)*

| Libellé affiché | Saisie | Démo |
|---|---|---|
| Estimation en ligne activée | interrupteur | désactivée tant que les tarifs ne sont pas validés |
| Durée de validité d'une estimation | minutes | 30 min |
| Afficher au client l'heure d'arrivée estimée | interrupteur | désactivé (décision à prendre) |
| Marge de sécurité sur l'heure d'arrivée | minutes | 10 min |
| Afficher au client le nom des suppléments (sans montant) | interrupteur | activé (décision à prendre) |

### 3.11 Entreprise, dépanneuse et zone (Paramètres)

| Libellé affiché | Saisie | Valeur initiale |
|---|---|---|
| Nom affiché | texte | RNB AUTO |
| Téléphone | téléphone | À COMPLÉTER |
| Numéro WhatsApp | téléphone | À COMPLÉTER |
| Email | email | À COMPLÉTER |
| Adresse de départ (dépôt) | adresse + carte de confirmation | 145 rue de Paris, 93000 Bobigny |
| Disponibilité | 24h/24 7j/7, ou horaires par jour | À COMPLÉTER |
| TVA : entreprise soumise à la TVA, taux, prix saisis TTC ou HT | choix, % | À COMPLÉTER ; 20 % ; TTC |
| Ma dépanneuse : type, PTAC, charge utile, hauteur | choix, kg, cm | À COMPLÉTER |
| Distance maximale jusqu'au client pour une estimation automatique | km | 50 km (démo) |
| Distance maximale de transport pour une estimation automatique | km | 150 km (démo) |
| Zones où RNB AUTO n'intervient pas directement | liste : nom, activée, message au client | « Autoroutes et voies rapides », texte à valider |

### 3.12 Itinéraires *(avancé, Paramètres → Services externes)*

| Libellé affiché | Saisie | Valeur initiale |
|---|---|---|
| Service de calcul principal / de secours | choix | Géoplateforme IGN / OpenRouteService |
| Type d'itinéraire | le plus rapide / le plus court | le plus rapide |
| Éviter les péages | interrupteur | activé (démo) |
| Précision des kilomètres facturés | au dixième / au km supérieur | au dixième |

### 3.13 Règles personnalisées *(avancé, Phase 10)*

Assistant en trois questions :

1. **Nom** : « Supplément véhicule très bas »
2. **Quand ?** Choix dans une liste : une option est cochée, un type de véhicule, un jour, une heure, une distance, une commune de prise en charge…
3. **Action** : `+` ou `−`, `€` ou `%`, valeur ; affichée au client ou non.

## 4. Vocabulaire

| Nom technique (jamais affiché) | Libellé affiché |
|---|---|
| `minimumPrice` | Prix minimum d'une intervention |
| `pickupFee` | Prise en charge |
| `emptyOutRate` | Prix au kilomètre lorsque la dépanneuse est vide (aller) |
| `loadedRate` | Prix au kilomètre avec le véhicule chargé |
| `emptyBackRate` | Prix au kilomètre du retour au dépôt |
| `freeKm` | Kilomètres offerts |
| `fuelIndexation` | Impact du carburant |
| `wearCostPerKm` | Usure et entretien (par km) |
| `depreciationPerKm` | Amortissement de la dépanneuse (par km) |
| `laborRate` | Coût d'une heure de travail |
| `handlingMinutes` | Temps de chargement et déchargement |
| `minMargin` | Marge minimale |
| `targetMargin` | Marge visée |
| `roundingStep` | Arrondir le prix |
| `stackingPolicy` | Si plusieurs majorations tombent en même temps |
| `priority` | Ordre d'application |
| `clientVisible` | Affiché au client |
| `quoteValidity` | Durée de validité d'une estimation |
| `regulatedRoads` | Zones où RNB AUTO n'intervient pas directement |

## 5. Exemples d'écrans

```
┌──────────────────────────────────────────────┐
│  Mes tarifs                 [ Simple|Avancé ]│
├──────────────────────────────────────────────┤
│  PRIX MINIMUM D'UNE INTERVENTION     [● ON ] │
│  Montant                         [ 45 ] €    │
│  ⓘ Le client ne paiera jamais moins que ce   │
│    montant, même pour un trajet très court.  │
├──────────────────────────────────────────────┤
│  DÉPLACEMENT JUSQU'AU CLIENT         [● ON ] │
│  Dépanneuse vide              [ 1,00 ] €/km  │
│  ➜ Exemple : 20 km = 20,00 €                 │
├──────────────────────────────────────────────┤
│  NUIT                                [● ON ] │
│  De [ 22:00 ] à [ 06:00 ]                    │
│  Supplément   (•) %   ( ) €        [ 20 ] %  │
├──────────────────────────────────────────────┤
│        [  ENREGISTRER LES MODIFICATIONS  ]   │
└──────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────┐
│  Vous allez modifier :                       │
│   • Prix minimum : 45 € → 50 €               │
│                                              │
│  Effet sur vos trajets de référence :        │
│   • Batterie à Drancy : 45 € → 50 €          │
│   • Bobigny → Montreuil : inchangé           │
│                                              │
│  Motif (facultatif) : [                   ]  │
│                                              │
│   [ ANNULER ]               [ CONFIRMER ]    │
└──────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────┐
│  Vos tarifs sont-ils prêts ?                 │
│   [x] Prix de base               vérifié     │
│   [x] Horaires et jours          vérifié     │
│   [ ] Véhicules                  à vérifier  │
│   [ ] Situations                 à vérifier  │
│   [ ] Carburant                  à vérifier  │
│   [ ] Adresse de départ          à vérifier  │
│                                              │
│  L'estimation en ligne s'activera quand      │
│  tout sera vérifié.                          │
└──────────────────────────────────────────────┘
```

## 6. Garde-fous de saisie

- **Valeurs refusées** (bornes dures) : montant négatif, pourcentage au-delà de 500 %, heure invalide, consommation nulle…
- **Valeurs inhabituelles** (bornes souples), avec confirmation : par exemple un prix au km au-dessus de 10 €, un minimum au-dessus de 300 €, une majoration au-dessus de 100 %, une consommation hors de 5 à 40 L/100 km.
- Messages toujours en français simple : *« Ce prix au kilomètre paraît très élevé (12,00 €/km). Confirmez-vous ? »*
- Aperçu d'impact sur les trajets de référence avant chaque enregistrement.

## 7. Historique des modifications et retour en arrière

- Chaque modification enregistrée apparaît dans « Historique des tarifs » :

  ```
  03/10/2026 à 18:42 — Administrateur
  Prix minimum : 45 € → 50 €
  Motif : hausse des coûts
  [ Voir le détail ]   [ Revenir à cette version ]
  ```

- « Revenir à cette version » crée une nouvelle version identique à l'ancienne. Rien n'est effacé.
- Les interventions déjà créées gardent toujours leurs propres tarifs (voir [03 — Moteur tarifaire](03-moteur-tarifaire.md), §18).
