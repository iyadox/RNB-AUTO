# 01 — Vision, pages et parcours

> Document de cadrage du 03/10/2026, mis à jour le 04/10/2026. Ce qui est déjà réalisé est indiqué dans [06 — Feuille de route](06-feuille-de-route.md).

## 1. Résumé du projet

RNB AUTO est une entreprise de **dépannage, remorquage et assistance routière** située au 145 rue de Paris, 93000 Bobigny. Elle dispose aujourd'hui d'une dépanneuse.

Le projet n'est pas un simple site vitrine. C'est un **système professionnel**, construit progressivement, qui a deux faces :

1. **Le site client.** Il s'adresse à une personne en panne, sur son téléphone, souvent stressée. Elle doit comprendre immédiatement quoi faire : appeler ou écrire sur WhatsApp en un geste, ou obtenir une estimation et envoyer une demande en moins de deux minutes.
2. **L'espace RNB AUTO.** Il permet de suivre chaque demande jusqu'à la fin de l'intervention, de suivre l'activité et de **régler tous les paramètres de prix** sans aucune compétence technique.

Au centre se trouve un **moteur tarifaire** qui raisonne comme l'entreprise :

- la dépanneuse fait **trois trajets** : dépôt → client (à vide), client → destination (chargée), destination → dépôt (à vide) ;
- il calcule séparément le **prix client** et le **coût interne** (carburant, usure, temps…), et donc la **marge** ;
- chaque estimation garde une **photographie** des règles utilisées : un changement de tarif ne s'applique jamais aux interventions passées.

Philosophie : **très puissant derrière, extrêmement simple devant.**

## 2. Périmètre

| Inclus maintenant | Hors périmètre | Plus tard (prévu dans l'architecture) |
|---|---|---|
| Dépannage, remorquage, assistance (hors zones réglementées) | Vente de véhicules | Plusieurs dépanneuses et chauffeurs |
| Site public mobile, demande en ligne, estimation | | Position GPS des dépanneuses, attribution automatique |
| Administration simple : tarifs, demandes, statistiques | | Application chauffeur, signature client, photos avant/après |
| Moteur tarifaire, simulateur, historiques | | SMS automatiques, paiement, devis, facturation |
| Prix du carburant manuel, puis automatique | | Planning, maintenance, consommation réelle |
| | | Studio d'animations verticales 9:16 (TikTok, Reels, Shorts) |

Règles de contenu :

- le site présente uniquement **l'entreprise** RNB AUTO, sans information personnelle sur ses dirigeants ;
- le vocabulaire et les visuels sont ceux du **dépannage et du remorquage**, jamais de la vente automobile.

## 3. Pages publiques

### Éléments présents sur toutes les pages (mobile)

- Une **barre d'action fixe en bas de l'écran** avec trois boutons : `Appeler` · `WhatsApp` · `Demande en ligne`.
  - Ce sont de simples liens (`tel:` et lien WhatsApp). Ils fonctionnent même sans JavaScript, et même si la base de données ou un service externe est en panne.
  - Le message WhatsApp est pré-rempli avec ce que le client a déjà saisi : position, véhicule, problème.
- Un en-tête minimal : logo et numéro de téléphone cliquable.

### Liste des pages

| Page | Objectif |
|---|---|
| Accueil | gros bouton **« Besoin d'un dépannage ? »**, Appeler, WhatsApp ; réassurance : zone desservie, disponibilité, estimation immédiate, « comment ça marche » en 3 étapes |
| Demande de dépannage | parcours en étapes avec estimation (voir §5) |
| Demande envoyée / suivi | numéro de demande, prochaines étapes, consignes ; plus tard, statut en direct via un lien unique |
| Dépannage | page du service (référencement Google) |
| Remorquage | page du service |
| Assistance | batterie, crevaison… selon les services réellement proposés (question ouverte) |
| Zones d'intervention | Bobigny, Seine-Saint-Denis, Paris, Île-de-France ; pages par ville gérées depuis l'admin, chacune avec un vrai contenu (pas de pages copiées-collées) |
| Panne sur autoroute | que faire, pourquoi RNB AUTO n'intervient pas sur l'autoroute, comment RNB AUTO peut prendre le relais ensuite |
| Questions fréquentes | délais, paiement, véhicules acceptés, documents, photos… |
| L'entreprise | présentation de RNB AUTO, de sa dépanneuse, de sa façon de travailler |
| Contact | téléphone, WhatsApp, email, adresse, carte |
| Mentions légales | obligations légales |
| Confidentialité | données collectées (position, téléphone, photos), durée de conservation, droits |
| Conditions d'intervention | différence entre estimation et prix confirmé, annulation, paiement |
| Page d'erreur / hors connexion | toujours avec les boutons Appeler et WhatsApp |

Une page « Comment est calculé votre prix » est possible mais facultative (décision à prendre). Elle expliquerait les principes (distance, véhicule, horaire, situation) sans jamais montrer les coûts internes.

### Direction visuelle proposée

- Univers **route et signalisation** : fond asphalte sombre, **jaune de signalisation** (contraste maximal, lisible en plein soleil), blanc ; motifs de marquage au sol et de chevrons de balisage ; lueur de gyrophare très discrète.
- Titres en typographie condensée et robuste, dans l'esprit des panneaux routiers ; texte courant très lisible.
- **Vraies photos** de la dépanneuse RNB AUTO plutôt que des images génériques.
- Pas de grille de « trois cartes » : des sections pleine largeur, avec une hiérarchie qui mène à l'action.
- Animations en CSS, légères, désactivées quand le téléphone demande moins d'animations, et jamais sur le chemin d'urgence.
- Zones tactiles d'au moins 48 px ; actions principales à portée du pouce.
- La même identité (couleurs, typographies, logo) servira plus tard au studio vidéo 9:16.

## 4. Pages administrateur

Elles sont pensées pour être utilisées **depuis un téléphone**, y compris dans la dépanneuse : gros boutons, une action principale par écran, vocabulaire simple, confirmations, aides courtes.

| Page | Contenu |
|---|---|
| Connexion | identifiant, mot de passe, « mot de passe oublié » |
| Accueil (tableau de bord) | aujourd'hui : interventions, chiffre d'affaires, km, carburant estimé, coût estimé, marge estimée, demandes en attente ; raccourcis « Nouvelle demande (appel) » et « Tester mes tarifs » ; interrupteur de disponibilité (proposition) |
| Demandes | liste filtrable par statut, nouvelles demandes en tête, recherche rapide |
| Fiche intervention | client (appel ou WhatsApp en un geste), carte des 3 trajets, véhicule, situation, photos, **détail du calcul** (vue admin), ajustements, prix confirmé, **gros boutons de statut**, journal, notes internes |
| Nouvelle demande (appel) | saisie pendant un appel : mêmes questions que le client, prix immédiat, création de l'intervention |
| Tester mes tarifs | simulateur complet (voir [03 — Moteur tarifaire](03-moteur-tarifaire.md), §16) ; on peut essayer un réglage avant de l'enregistrer |
| Mes tarifs | **mode simple** : prix de base, horaires, jours, véhicules, situations, carburant ; **mode avancé** : en plus, coûts internes, marge, arrondi, cumul des majorations, règles personnalisées, options d'estimation |
| Historique des tarifs | date, réglage, avant → après, utilisateur, motif ; bouton « Revenir à cette version » |
| Historique des interventions | recherche par date, client, téléphone, ville, véhicule, statut ; export pour le comptable |
| Statistiques | aujourd'hui, semaine, mois, année : chiffre d'affaires, km, carburant, coûts, marge, types de panne, villes |
| Clients | fiche client, historique, notes (ex. « client régulier ») |
| Paramètres → Entreprise | nom, téléphone, WhatsApp, email, **adresse de départ** (avec carte pour confirmer), horaires ou disponibilité |
| Paramètres → Ma dépanneuse | consommation à vide et en charge, capacité, hauteur |
| Paramètres → Zone d'intervention | distances maximales pour une estimation automatique, zones réglementées (autoroutes…) et messages affichés au client |
| Paramètres → Site | message temporaire (ex. « forte demande, délai allongé »), textes principaux |
| Paramètres → Notifications | qui reçoit les nouvelles demandes, et comment (notification sur le téléphone, email, SMS) |
| Paramètres → Mon compte | mot de passe, double vérification (option) |
| Paramètres → Services externes *(avancé)* | état des services (cartes, carburant, notifications), dernier succès, fournisseur utilisé |

## 5. Parcours client

Objectif : **prix affiché en moins d'une minute, demande envoyée en moins de deux.**

Principes :

- un écran = une question ; grosses tuiles ; quand on touche une tuile, on passe à l'écran suivant ;
- barre de progression, retour possible, **Appeler et WhatsApp toujours visibles** ;
- la saisie est conservée sur le téléphone en cas de coupure réseau ou de rechargement de la page ;
- le client ne répond qu'aux questions qui changent vraiment l'estimation.

### Les étapes

**Étape 1 — Où êtes-vous ?**

- `[📍 Utiliser ma position]` : autorisation du navigateur, puis l'adresse trouvée est affichée pour confirmation. Ou saisie de l'adresse avec suggestions automatiques.
- Puis : **« Êtes-vous sur une autoroute ou une voie rapide ? »** `Non` · `Oui` · `Je ne sais pas`.

**Branche autoroute (réponse « Oui »)**

1. Écran **« Votre sécurité d'abord »** : feux de détresse, gilet avant de sortir, tous les passagers derrière la glissière, borne d'appel d'urgence orange ou 112. Texte à valider.
2. Explication claire : *« Sur l'autoroute, seul le dépanneur agréé pour ce secteur peut intervenir. Il sortira votre véhicule de l'autoroute. RNB AUTO peut ensuite prendre le relais pour l'emmener où vous voulez. »*
3. Question : **« À quelle sortie ou à quel endroit hors de l'autoroute le véhicule pourra-t-il être récupéré ? »** Réponse possible : une adresse, le nom de la sortie ou le dépôt du dépanneur agréé. Ou `Je ne sais pas encore`, qui renvoie vers Appeler et WhatsApp.
4. Ce point devient l'**adresse de prise en charge**. La demande est marquée « relais après autoroute ».

La liste des voies concernées et les textes sont **réglables dans l'admin** (Paramètres → Zone d'intervention). Plus tard, une détection automatique est possible quand la position GPS est sur une autoroute ; la question resterait posée pour confirmation.

**Étape 2 — Où doit aller le véhicule ?**

- Adresse avec suggestions, ou raccourcis : `Un garage` · `Mon domicile` · (option) `Le dépôt RNB AUTO`.
- Si le dépannage sur place est proposé : `Pas besoin de transport`. L'estimation ne compte alors que l'aller et le retour.

**Étape 3 — Quel véhicule ?**

- Tuiles illustrées : petite citadine, berline, break, SUV, 4x4, utilitaire, petit fourgon, grand fourgon, autre.
- Chaque catégorie se règle dans l'admin : « acceptée », « sur demande » (pas de prix automatique, rappel) ou masquée.

**Étape 4 — Quel est le problème ?**

- Quelques tuiles simples : ne démarre pas / batterie, crevaison, accident, panne mécanique, roues bloquées, bloqué dans un parking, autre.
- « Le véhicule peut-il rouler ? » `Oui` · `Non` · `Je ne sais pas`, sauf si la réponse est déjà évidente.
- Photos facultatives, prises directement avec l'appareil photo. Elles sont compressées sur le téléphone et envoyées en arrière-plan ; elles n'empêchent jamais d'avancer.
- Seules les situations marquées **« visible client »** sont proposées. Les autres (treuillage, véhicule difficile à charger, véhicule très lourd…) sont ajoutées par l'admin après l'appel ou sur place.

**Étape 5 — Estimation**

- Trajet de votre véhicule : **XX km**.
- **Prix estimé : XX € TTC**.
- Services inclus (libellés seulement, aucun montant interne).
- En option : arrivée estimée de la dépanneuse, par exemple « environ 35 à 45 min ».
- Mention : *« Estimation indicative, confirmée par RNB AUTO avant l'intervention. »*
- `[ DEMANDER LE DÉPANNAGE ]`

**Étape 6 — Vos coordonnées et récapitulatif (un seul écran)**

- Nom ou prénom, **téléphone** (obligatoire). Facultatifs : email, marque, modèle, immatriculation, remarque.
- Récapitulatif complet, avec un lien « Modifier » sur chaque bloc.
- Information sur l'utilisation des données.
- `[ ENVOYER MA DEMANDE ]`

**Étape 7 — Demande reçue**

- « Demande n° RNB-XXXX reçue. Nous vous rappelons dans quelques minutes. »
- Appeler, WhatsApp, consignes de sécurité.

### Cas dégradés : il y a toujours une issue

| Situation | Ce que voit le client |
|---|---|
| Position refusée ou imprécise | saisie de l'adresse, sans blocage |
| Service d'itinéraire indisponible | « Nous ne pouvons pas calculer le prix pour l'instant. » La demande part **sans prix** et RNB AUTO rappelle avec un prix ; Appeler et WhatsApp restent disponibles |
| Adresse hors zone ou trajet trop long | pas de prix automatique : demande « sur devis » et bouton Appeler |
| Véhicule « sur demande » | idem |
| Estimation expirée au moment d'envoyer | nouveau calcul ; si le prix change, il est affiché avant l'envoi |
| Coupure réseau | la saisie est conservée ; Appeler fonctionne toujours |

Règle : **aucune approximation n'est jamais affichée comme un prix.**

## 6. Parcours d'une intervention

### Statuts

```
NOUVELLE DEMANDE ─► À RAPPELER ─► ACCEPTÉE ─► DÉPANNEUSE EN ROUTE ─► ARRIVÉE ─► VÉHICULE CHARGÉ ─► TRANSPORT EN COURS ─► TERMINÉE
       │                │             │                │                  │
       └────────────────┴─────────────┴────────────────┴──────────────────┴─► ANNULÉE (motif obligatoire)

ARRIVÉE ─► TERMINÉE        (dépannage sur place, sans transport)
```

- Les transitions autorisées sont définies à un seul endroit. Sauter une étape reste possible avec confirmation, par exemple pour une saisie après coup.
- Motifs d'annulation : annulée par le client, client injoignable, hors zone, véhicule non transportable, doublon, autre.

### Déroulement

1. **Création**
   - Depuis le site : le serveur **recalcule lui-même** l'estimation à partir des choix du client. Le prix affiché dans le navigateur n'est jamais repris tel quel. Le serveur enregistre la photographie et crée la demande au statut `NOUVELLE`.
   - Depuis l'admin, pendant un appel (« Nouvelle demande (appel) ») : source « téléphone ».
   - L'admin reçoit une notification immédiate.
2. **Qualification**
   - L'admin appelle le client en un geste et complète les informations, par exemple en ajoutant « treuillage ». Il **recalcule** si besoin : une nouvelle révision est créée et l'ancienne reste consultable.
   - Ajustements manuels : `Supplément / Remise`, `€ / %`, valeur, **motif** (« Client régulier », « Accès difficile », « Remise commerciale », « Attente supplémentaire »…).
   - **Confirmation du prix** : statut `ACCEPTÉE`, ou `À RAPPELER`, ou `ANNULÉE`.
   - Plus tard : SMS ou WhatsApp automatique de confirmation au client.
3. **Exécution.** Un gros bouton par étape : `En route` → `Arrivé` → `Chargé` → `Transport` → `Terminé`. Chaque passage est horodaté, ce qui donne les durées et délais réels. Si la situation sur place est différente, l'admin fait un ajustement avec motif (plus tard : accord du client signé sur le téléphone).
4. **Clôture.** Au statut `TERMINÉE`, le prix final est figé et l'intervention entre dans les statistiques (chiffre d'affaires, km, carburant, coût, marge). Toute correction ultérieure exige un motif et reste tracée.

Chaque événement (changement de statut, appel, ajustement, photo, notification) est conservé dans le **journal de l'intervention**. Les champs « dépanneuse » et « chauffeur » existent dès le départ pour accueillir la future flotte.

## 7. Ce que voit le client, ce que voit l'admin

| Information | Client | Admin |
|---|:-:|:-:|
| Distance utile (trajet du véhicule) | ✅ | ✅ |
| Détail des 3 trajets (km, durée) | — | ✅ |
| Prix estimé, prix confirmé | ✅ | ✅ |
| Services inclus (libellés) | ✅ | ✅ |
| Montant de chaque supplément | réglable | ✅ |
| Prix minimum appliqué | — | ✅ |
| Prix avant arrondi | — | ✅ |
| Carburant, usure, coûts internes | — | ✅ |
| Marge, alertes de rentabilité | — | ✅ |
| Règles appliquées, version des tarifs | — | ✅ |
| Fournisseur de calcul, sources des données | — | ✅ (avancé) |
