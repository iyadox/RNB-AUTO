# 05 — Réglages administrables

> Version 1.0 du 04/10/2026. Le catalogue (§3) est tiré du registre des réglages et des données de départ réellement installées.
>
> Les valeurs de départ sont des **moyennes du marché francilien (octobre 2026)**, choisies pour donner des prix « normaux ». Ce ne sont pas des tarifs officiels de RNB AUTO : l'administrateur les relève ou les baisse dans « Mes tarifs ». Le prix minimum de 45 € vient du cahier des charges.

## 1. Comment on garantit que tout se règle sans code

1. **Aucune valeur commerciale dans le code.** Le moteur ne contient que des mécanismes et ne peut pas calculer sans recevoir les réglages. Un test automatique (`no-hardcoded-values.test.ts`) échoue si un montant est écrit en dur dans le code du moteur.
2. **Un registre unique des réglages.** Chaque réglage y est décrit une seule fois : nom français, aide, unité, bornes, niveau (simple ou avancé), valeur de départ. À partir de ce registre sont produits automatiquement :
   - le champ dans l'écran d'administration ;
   - la validation côté navigateur **et** côté serveur ;
   - le libellé dans l'historique des modifications.

   Un réglage absent du registre ne peut pas exister : impossible d'avoir une valeur utilisée par le moteur sans qu'elle soit modifiable.
3. **Des règles en base plutôt que des conditions dans le code.** Ajouter un type de véhicule, une situation, une plage horaire, un jour férié ou un frais fixe revient à ajouter une ligne depuis l'admin.
4. **Des valeurs de départ réalistes.** À l'installation, tout est rempli avec des moyennes du marché : le site donne tout de suite des prix cohérents. L'accueil de l'administration liste ce qu'il reste à compléter (téléphone, mentions légales, position du dépôt…), et « Tester mes tarifs » permet de vérifier n'importe quel trajet avant d'ajuster.
5. **Modifier sans risque.**
   - Confirmation avec aperçu d'impact sur les trajets de référence.
   - Alertes sur les valeurs inhabituelles.
   - Bouton « Annuler » juste après l'enregistrement.
   - Historique complet et retour à une version précédente en un clic.
6. **Validation côté serveur** de chaque valeur, avec des messages en français simple.
7. **Le simulateur** montre immédiatement l'effet d'un réglage, avant même de l'enregistrer.

### Définition d'un réglage dans le registre

Extrait de `src/core/settings/registry.ts` :

```ts
"pricing.minimum.amountCents": num("money", {
  section: "base",                      // écran et rubrique où le réglage apparaît
  level: "simple",                      // simple : toujours visible ; avancé : en mode avancé
  label: "Montant minimum",             // seul texte affiché (jamais la clé technique)
  initialValue: 4500,                   // valeur de départ (centimes), écrite une seule fois en base
  min: 0, max: 100_000,                 // bornes dures : valeur refusée en dehors
  softMax: 30_000,                      // borne souple : confirmation demandée au-delà
}),
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

Chaque ligne correspond à un champ de l'administration (« Mes tarifs » ou « Paramètres »). Les règles de prix, véhicules et situations sont des lignes en base : on peut en **ajouter** depuis « Mes tarifs » (plage horaire, frais fixe, type de véhicule, situation) sans toucher au code.

### Prix de base

Forfaits, prix au kilomètre et prix minimum.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Prix minimum d'une intervention | interrupteur | simple | Activé |
| Montant minimum | € | simple | 45,00 € |
| Kilomètres facturés | choix | avancé | Au dixième de km (12,3 km) |

### Horaires et jours

Nuit, dimanche, jours fériés et règles de cumul.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Heure prise en compte pour les majorations | choix | avancé | L'heure de la demande |
| Si c'est à la fois un jour majoré (dimanche…) et un jour férié | choix | avancé | Appliquer seulement la plus élevée |
| Si deux plages horaires se chevauchent | choix | avancé | Appliquer seulement la plus élevée |
| La nuit s'ajoute-t-elle au dimanche ou à un jour férié ? | choix | avancé | Non, appliquer seulement la plus élevée |
| Jours fériés à ignorer | calendrier | avancé | Aucun |
| Jours majorés ajoutés | liste de dates | avancé | Aucun |

### Carburant

Consommation de la dépanneuse et prix du litre.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Consommation de la dépanneuse à vide | nombre | simple | 13 L/100 km |
| Consommation avec un véhicule chargé | nombre | simple | 16 L/100 km |
| Prix du carburant | choix | simple | Manuel |
| Prix du litre | €/L | simple | 2,350 €/L |
| Carburant de la dépanneuse | choix | avancé | Gazole |
| Stations prises en compte autour du dépôt | nombre entier | avancé | 10 km |
| Revenir au prix manuel si le prix automatique a plus de | nombre entier | avancé | 72 heures |
| Prix jugé aberrant en dessous de | €/L | avancé | 1,000 €/L |
| Prix jugé aberrant au-dessus de | €/L | avancé | 3,500 €/L |
| Impact du carburant sur le prix client | interrupteur | avancé | Désactivé |
| Prix du carburant de référence | €/L | avancé | 2,350 €/L |
| Part du carburant dans vos prix au kilomètre | % | avancé | 30 % |
| Variation maximale | % | avancé | 10 % |

### Coûts internes

Ce que coûte réellement une intervention. Jamais montré au client.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Temps de chargement et de déchargement | nombre entier | avancé | 20 min |
| TVA récupérable sur le carburant | % | avancé | 100 % |

### Marge

Marge minimale, marge visée et garde-fous.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Marge minimale par intervention (HT) | € | avancé | 15,00 € |
| Marge visée | % | avancé | 30 % |
| Si une estimation en ligne n'atteint pas la marge minimale | choix | avancé | Relever le prix automatiquement |

### Arrondi

Arrondir le prix affiché au client.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Arrondir le prix client | interrupteur | avancé | Activé |
| Précision | choix | avancé | Aux 5 € (85 €, 90 €) |
| Sens | choix | avancé | Au plus proche |
| Arrondir aussi après un ajustement manuel | interrupteur | avancé | Activé |

### TVA

Taux de TVA et prix saisis TTC ou HT.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Votre entreprise facture la TVA | interrupteur | avancé | Activé |
| Taux de TVA | % | avancé | 20 % |
| Les montants saisis dans « Mes tarifs » sont | choix | avancé | TTC (ce que paie le client) |

### Estimation en ligne

Ce que voit le client sur le site.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Estimation en ligne | interrupteur | simple | Activé |
| Montrer au client le nom des suppléments (sans montant) | interrupteur | avancé | Activé |
| Durée de validité d'une estimation | nombre entier | avancé | 30 min |

### Zone d'intervention *(Paramètres)*

Distances maximales et autoroutes.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Distance maximale jusqu'au client | nombre entier | simple | 80 km |
| Distance maximale de transport | nombre entier | simple | 150 km |
| Demander au client s'il est sur une autoroute | interrupteur | simple | Activé |
| Message affiché au client sur l'autoroute | texte | simple | Sur l'autoroute et les voies rapides, seul le dépanneur agréé pour ce secteur peut inte… |

### Adresse de départ *(Paramètres)*

Le dépôt d'où part et où revient la dépanneuse.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Adresse de départ (dépôt) | adresse + carte | simple | 145 rue de Paris, 93000 Bobigny |

### Calcul des trajets *(Paramètres)*

Façon de calculer les itinéraires.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Type d'itinéraire | choix | avancé | Le plus rapide |

### Entreprise *(Paramètres)*

Nom, téléphone, WhatsApp, email, disponibilité.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Nom affiché | texte | simple | RNB AUTO |
| Téléphone | téléphone | simple | À COMPLÉTER |
| Numéro WhatsApp | téléphone | simple | (vide) |
| Email de contact | email | simple | À COMPLÉTER |
| Disponibilité affichée sur le site | texte | simple | À COMPLÉTER |
| Zone desservie (phrase courte) | texte | simple | Bobigny, la Seine-Saint-Denis, Paris et l'Île-de-France |

### Site internet *(Paramètres)*

Message temporaire et affichages.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Afficher un message temporaire en haut du site | interrupteur | simple | Désactivé |
| Message temporaire | texte | simple | (vide) |
| Montrer un exemple de prix sur la page d'accueil | interrupteur | simple | Activé |

### Mentions légales *(Paramètres)*

Informations obligatoires affichées sur le site.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Raison sociale | texte | simple | À COMPLÉTER |
| Forme juridique | texte | simple | À COMPLÉTER |
| Numéro SIRET | texte | simple | À COMPLÉTER |
| Numéro de TVA intracommunautaire | texte | simple | (vide) |
| Adresse du siège | texte | simple | 145 rue de Paris, 93000 Bobigny |
| Directeur ou directrice de la publication | texte | simple | À COMPLÉTER |
| Hébergeur du site | texte | simple | À COMPLÉTER |
| Assurance professionnelle (facultatif) | texte | simple | (vide) |

### Notifications *(Paramètres)*

Qui est prévenu des nouvelles demandes.

| Libellé affiché | Saisie | Mode | Valeur de départ |
|---|---|---|---|
| Email qui reçoit les nouvelles demandes | email | simple | (vide) |

### Règles de prix (Mes tarifs)

| Règle | Catégorie | Calcul de départ | Active |
|---|---|---|---|
| Forfait remorquage | forfait | 75,00 € | oui |
| Forfait dépannage sur place | forfait | 55,00 € | oui |
| Déplacement jusqu'au client | prix au km | 1,00 €/km | oui |
| Trajet avec le véhicule chargé | prix au km | 2,20 €/km | oui |
| Retour au dépôt | prix au km | 0,50 €/km | oui |
| Nuit | plage horaire | 25 % de la prestation complète | oui |
| Lundi | jour | 0 % de la prestation complète | non |
| Mardi | jour | 0 % de la prestation complète | non |
| Mercredi | jour | 0 % de la prestation complète | non |
| Jeudi | jour | 0 % de la prestation complète | non |
| Vendredi | jour | 0 % de la prestation complète | non |
| Samedi | jour | 0 % de la prestation complète | non |
| Dimanche | jour | 25 % de la prestation complète | oui |
| Jours fériés | jour férié | 25 % de la prestation complète | oui |
| Carburant | coût interne | selon consommation et prix du litre | oui |
| Usure et entretien | coût interne | 0,12 €/km | oui |
| Amortissement de la dépanneuse | coût interne | 0,20 €/km | oui |
| Assurance et frais généraux | coût interne | 10,00 € | oui |
| Temps de travail | coût interne | 25,00 €/h | oui |

### Véhicules

| Catégorie | Acceptée | Supplément de départ |
|---|---|---|
| Petite citadine | oui | aucun |
| Berline | oui | aucun |
| Break | oui | aucun |
| SUV | oui | + 15,00 € |
| 4x4 | oui | + 20,00 € |
| Utilitaire | oui | + 25,00 € |
| Petit fourgon | oui | + 30,00 € |
| Grand fourgon | sur demande | + 50,00 € |
| Autre | sur demande | aucun |

### Situations

| Situation | Proposée au client | Supplément de départ |
|---|---|---|
| Batterie | oui | aucun |
| Crevaison | oui | aucun |
| Panne mécanique | oui | aucun |
| Accident | oui | + 25,00 € |
| Roues bloquées | oui | + 30,00 € |
| Autre problème | oui | aucun |
| Véhicule roulant | oui | aucun |
| Véhicule non roulant | oui | + 15,00 € |
| Véhicule dans un parking | oui | + 20,00 € |
| Véhicule difficile à charger | non (ajoutée par RNB AUTO) | + 20,00 € |
| Treuillage | non (ajoutée par RNB AUTO) | + 40,00 € |
| Accès difficile | non (ajoutée par RNB AUTO) | + 20,00 € |
| Véhicule particulièrement lourd | non (ajoutée par RNB AUTO) | + 20 % du prix de base |

### Ajouts depuis l'administration

- **Plages horaires** (ex. « Soirée 19 h – 22 h, + 10 % »), **frais fixes**, **types de véhicule**, **situations** : bouton « Ajouter » dans la rubrique correspondante.
- **Jours fériés** : fériés nationaux calculés automatiquement ; chacun peut être ignoré, et des dates peuvent être ajoutées.
- **Règles personnalisées libres** (assistant « Nom → Quand ? → Action ») : prévues en Phase 10.

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

L'écran « Vos tarifs sont-ils prêts ? » prévu au cadrage n'a pas été retenu : les valeurs de départ étant réalistes, l'estimation en ligne est active dès l'installation. L'accueil de l'administration affiche à la place la liste « Pour démarrer ».

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
