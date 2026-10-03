# 02 — Architecture technique

> Document de cadrage, version 0.1 du 03/10/2026. Choix techniques proposés, à valider.

## 1. Principes directeurs

1. **Séparation stricte** des responsabilités : interface publique, administration, moteur tarifaire, itinéraires, carburant, interventions, utilisateurs, statistiques, paramètres, notifications, base de données.
2. **Moteur tarifaire pur.** Il reçoit tout en entrée (choix du client, distances, prix du carburant, réglages) et rend un résultat détaillé, sans accès à la base de données ni au réseau. Il est donc testable, reproductible et réutilisable partout : site, simulateur, saisie téléphonique, future application chauffeur.
3. **Aucune valeur commerciale dans le code.** Chaque réglage vit en base, est versionné et se modifie dans l'admin.
4. **Le serveur est seul juge du prix.** Le navigateur envoie des choix, jamais un montant.
5. **Un adaptateur pour chaque service externe**, avec solution de repli. Aucune panne externe ne bloque l'appel ni l'envoi d'une demande.
6. **Montants en centimes entiers**, pourcentages en points de base (1 % = 100), heures dans le fuseau `Europe/Paris`.
7. **Tout est tracé** : qui a changé quoi et quand, et chaque estimation garde sa photographie.
8. **Mobile d'abord**, pour le public comme pour l'admin.

## 2. Stack proposée

| Besoin | Proposition | Raisons | Alternatives |
|---|---|---|---|
| Langage | TypeScript (mode strict) partout | un seul langage ; types partagés entre moteur, serveur et écrans | — |
| Site, admin, API | Next.js (App Router) | pages publiques pré-générées, très rapides et bien référencées ; actions serveur pour l'admin et les calculs | Nuxt, SvelteKit, Laravel |
| Base de données | PostgreSQL hébergé dans l'UE | robuste et standard ; JSON pour les photographies ; sauvegardes | — |
| Accès base et migrations | Drizzle ORM | SQL typé, migrations versionnées | Prisma |
| Validation | Zod, schémas partagés client/serveur | une seule définition des règles de saisie | — |
| Authentification | bibliothèque éprouvée (ex. Better Auth) : sessions en base, mot de passe haché (argon2id ou scrypt), limitation des tentatives | pas de cryptographie « maison » | authentification de l'hébergeur de base |
| Interface | Tailwind CSS et composants accessibles (Radix) aux couleurs de RNB AUTO | design sur mesure ; interrupteurs et fenêtres de confirmation accessibles | CSS Modules |
| Géocodage | API Géoplateforme de l'IGN (Base Adresse Nationale) | gratuite, officielle ; autocomplétion et géocodage inverse | Google, Mapbox |
| Itinéraires | service d'itinéraire de la Géoplateforme IGN ou OpenRouteService ; Google Routes en option | gratuits pour démarrer ; fournisseur interchangeable | OSRM auto-hébergé, Mapbox |
| Affichage de carte | MapLibre et fond de carte libre | pas de coût par affichage | Google Maps |
| Prix du carburant | jeu de données officiel « Prix des carburants en France — flux instantané » | gratuit, officiel, mis à jour toutes les 10 minutes, détaillé par station | — |
| Photos | stockage objet privé dans l'UE, liens temporaires signés | confidentialité | — |
| Notifications | Web Push (admin installé sur l'écran d'accueil du téléphone) et email (ex. Resend) ; SMS ensuite (ex. Twilio ou opérateur français) | gratuit au départ et instantané | WhatsApp Business API, plus tard |
| Hébergement | hébergement managé (ex. Vercel, Netlify) et base managée dans l'UE (ex. Supabase région Paris ou Francfort, Neon, Scaleway) | pas de serveur à maintenir ; HTTPS automatique ; sauvegardes | VPS en France : moins cher, plus de maintenance |
| Tâches planifiées | tâches programmées de l'hébergeur | actualisation du carburant, purges, relances | — |
| Tests | Vitest (tests unitaires), Playwright (parcours complets sur mobile simulé) | — | — |
| Qualité | ESLint, Prettier, contrôle des types, GitHub Actions | chaque modification est vérifiée automatiquement | — |

Des connecteurs Supabase, Netlify, Resend, Twilio et Stripe sont disponibles dans l'environnement de travail. La stack proposée est compatible avec eux, si l'on choisit de les utiliser (à confirmer).

## 3. Structure du dépôt

```
rnb-auto/
├── apps/
│   ├── web/                      Next.js : site public, administration, API
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (public)/     pages publiques
│   │       │   ├── admin/        espace RNB AUTO (protégé)
│   │       │   └── api/          estimation, tâches planifiées, webhooks
│   │       ├── modules/          logique métier, un dossier par module
│   │       │   ├── settings/     réglages, versions, journal
│   │       │   ├── geocoding/    adresses + adaptateurs
│   │       │   ├── routing/      itinéraires + adaptateurs
│   │       │   ├── fuel/         prix du carburant + adaptateurs
│   │       │   ├── quotes/       orchestration des estimations
│   │       │   ├── interventions/
│   │       │   ├── customers/
│   │       │   ├── media/        photos
│   │       │   ├── notifications/
│   │       │   ├── stats/
│   │       │   └── auth/
│   │       └── ui/               composants d'interface
│   └── studio/                   (plus tard) animations 9:16
├── packages/
│   ├── pricing-engine/           moteur tarifaire pur
│   ├── db/                       schéma, migrations, données de démonstration
│   ├── brand/                    identité visuelle : couleurs, typographies, logo
│   └── shared/                   registre des réglages, schémas de validation, vocabulaire
└── docs/
```

Chaque module métier suit la même organisation :

- `domain/` : règles métier pures, par exemple les transitions de statut ;
- `repository/` : lecture et écriture en base ;
- `service/` : cas d'usage, par exemple « confirmer le prix d'une intervention » ;
- `providers/` : adaptateurs vers les services externes, si besoin.

Les écrans appellent uniquement des services. Ils n'accèdent jamais directement à la base ni à un fournisseur externe.

## 4. Modules et dépendances

| Module | Responsabilité | Dépend de |
|---|---|---|
| Paramètres et règles | réglages entreprise et tarifs, catalogues, versions, journal des modifications | base |
| Itinéraires | géocodage, géocodage inverse, calcul des 3 trajets, cache | Paramètres (dépôt, fournisseur) |
| Carburant | prix courant (automatique ou manuel), historique, repli | Paramètres |
| Moteur tarifaire | calcul pur | aucun (il reçoit tout) |
| Estimations | contexte → moteur → photographie | Paramètres, Itinéraires, Carburant, Moteur |
| Interventions | demandes, statuts, ajustements, journal | Estimations, Clients, Photos, Notifications |
| Clients | coordonnées, historique | base |
| Photos | envoi, contrôle, stockage privé | stockage |
| Notifications | file d'envoi avec nouvelles tentatives | Paramètres (destinataires), fournisseurs |
| Statistiques | agrégats par période | Interventions (lecture seule) |
| Utilisateurs et sécurité | comptes, sessions, rôles | base |

```
            ┌──────────────────────── Interfaces ────────────────────────┐
            │  Site public · Administration · (App chauffeur · Studio)   │
            └─────────────────────────────┬──────────────────────────────┘
                                          ▼
  Paramètres ──┐                 ┌──────────────────┐
  Itinéraires ─┼───────────────► │   Estimations    │ ───► Moteur tarifaire (pur)
  Carburant ───┘                 └────────┬─────────┘
                                          ▼
                                    Interventions ───► Notifications
                                     │        └──────► Photos, Clients
                                     ▼
                                Statistiques

  Utilisateurs et sécurité ───► protège tout l'espace admin
```

L'ordre de construction découle de ces dépendances : paramètres, base et sécurité, puis itinéraires, carburant manuel et moteur, puis estimations, interventions, statistiques, et enfin carburant automatique.

## 5. Le flux d'une estimation

1. Le navigateur envoie : position ou adresses, destination, véhicule, situation(s), moment souhaité.
2. Le serveur valide ces entrées : formats, valeurs autorisées, zone.
3. Il charge la **version de tarifs en vigueur** et le dépôt par défaut.
4. Il obtient le prix du carburant : automatique, sinon dernière valeur connue, sinon valeur manuelle.
5. Il calcule les 3 trajets : cache, sinon fournisseur principal, sinon fournisseur secondaire.
6. Il appelle le moteur pur.
7. Il enregistre l'estimation (photographie) avec une durée de validité et renvoie **uniquement la vue client** au navigateur.
8. À l'envoi de la demande, le navigateur renvoie seulement l'identifiant de l'estimation et les coordonnées. Le serveur vérifie que l'estimation est encore valide (sinon il recalcule) et crée l'intervention.

## 6. Services externes et solutions de repli

| Service | Principal (proposé) | Secours | Si tout échoue |
|---|---|---|---|
| Adresses (autocomplétion) | Géoplateforme IGN | second fournisseur | saisie libre et position GPS |
| Itinéraires | Géoplateforme IGN ou OpenRouteService | l'autre, ou Google | demande envoyée sans prix ; côté admin, saisie manuelle des km |
| Prix du carburant | données officielles : médiane des stations autour du dépôt, ou station choisie | dernière valeur valide | valeur manuelle |
| Notifications | Web Push et email | SMS | la demande est quand même enregistrée et visible dans l'admin |
| Photos | stockage objet | nouvel essai automatique | demande envoyée sans photo |

Règles communes :

- délai maximal court pour chaque appel, puis bascule ;
- coupe-circuit : un fournisseur en échec répété est écarté pendant un moment ;
- **cache des distances** : une même paire d'adresses ne change pas de distance, ce qui économise les quotas ;
- contrôle de vraisemblance des données reçues (par exemple, un prix du carburant hors bornes est rejeté et journalisé) ;
- page admin « Services externes » : état, dernier succès, dernière erreur.

## 7. Sécurité

- **Authentification** : mot de passe haché avec un algorithme moderne (argon2id ou scrypt) ; session côté serveur dans un cookie `HttpOnly`, `Secure`, `SameSite`, avec expiration et renouvellement ; tentatives de connexion limitées et ralenties ; double vérification par code en option.
- **Routes admin protégées** : la session est vérifiée **dans chaque action serveur et chaque route**, pas seulement à l'entrée des pages.
- **Validation côté serveur** de toutes les entrées avec les schémas partagés. Les contrôles dans le navigateur ne servent qu'au confort.
- **Intégrité du prix** : le prix n'est jamais lu depuis le navigateur. Une estimation est désignée par un identifiant aléatoire, a une durée de validité, et est recalculée si besoin.
- **Protection contre les abus** sur les points publics (estimation, envoi) : limitation par adresse IP, champ piège, vérification anti-robot discrète à l'envoi. Cela protège aussi les quotas des services de cartographie.
- **Photos** : types et tailles contrôlés côté serveur ; métadonnées supprimées, y compris la position GPS ; stockage privé ; liens temporaires.
- **En-têtes de sécurité** : HTTPS uniquement (HSTS), politique de sécurité du contenu (CSP), interdiction d'intégrer le site dans d'autres sites.
- **Secrets** (clés d'API) dans les variables d'environnement de l'hébergeur, jamais dans le code ni en base.
- **Journal** des actions sensibles : connexions, changements de tarifs, corrections d'interventions.
- **Sauvegardes** quotidiennes automatiques de la base, avec test de restauration.

## 8. Données personnelles (RGPD)

- Données collectées : nom, téléphone, email (facultatif), position, adresses, véhicule, photos.
- Information claire au moment de la saisie, et page Confidentialité.
- Position GPS : uniquement après un geste du client (bouton) et l'autorisation du navigateur.
- Minimisation : uniquement ce qui sert à l'intervention.
- Durées de conservation réglables : par exemple, les estimations sans demande sont supprimées après une durée courte ; les interventions sont conservées selon les obligations comptables.
- Données hébergées dans l'Union européenne.
- Demandes d'accès et de suppression traitées depuis l'admin.
- Mesure d'audience sans cookies publicitaires, donc sans bandeau intrusif.

## 9. Performance mobile

- Pages publiques pré-générées et servies depuis un réseau de diffusion (CDN).
- Très peu de JavaScript sur les pages publiques ; le parcours de demande est chargé étape par étape.
- Images optimisées et dimensionnées ; polices hébergées sur le site, chargées sans bloquer l'affichage.
- Objectifs : accueil utilisable en moins de 2 secondes sur une connexion 4G moyenne ; score mobile Lighthouse d'au moins 90.
- Le bouton Appeler fonctionne avant même la fin du chargement.

## 10. Évolutions prévues dès maintenant

| Évolution | Ce que l'architecture prévoit |
|---|---|
| Plusieurs dépanneuses | table `trucks` (une seule ligne aujourd'hui), consommation par dépanneuse, champ `truck_id` sur l'intervention |
| Plusieurs dépôts | table `depots` ; le dépôt de référence est un réglage |
| Chauffeurs | rôle « chauffeur » prévu, champ `driver_id` |
| Position GPS des dépanneuses | table des positions à ajouter ; le point de départ du calcul devient un choix (« dépôt » aujourd'hui, « position réelle » plus tard) |
| Attribution automatique | s'appuiera sur les positions et les disponibilités |
| Application chauffeur | d'abord une application web installable (même code, rôle chauffeur, gros boutons de statut) ; une application native si le suivi GPS en arrière-plan devient nécessaire |
| SMS et WhatsApp automatiques | module Notifications : file d'envoi, modèles de messages réglables |
| Paiement | module dédié (ex. Stripe, terminal de paiement sur place) relié à l'intervention |
| Devis et facturation | depuis septembre 2026, toute entreprise assujettie à la TVA doit pouvoir recevoir des factures électroniques, et les TPE/PME devront en émettre à partir de septembre 2027 : mieux vaut connecter un logiciel ou une plateforme agréée que développer une facturation maison |
| Signature client, photos avant/après | table `media`, avec les types prévus : photo client, avant, après, signature, document |
| Planning, maintenance, consommation réelle | tables à ajouter (pleins, entretiens) ; les coûts réels pourront remplacer les estimations dans les statistiques |
| Studio réseaux sociaux | `apps/studio` : modèles HTML/CSS/JS en 1080×1920 paramétrables (texte, prix, téléphone, ville), rendus image par image puis exportés en vidéo MP4, avec la même identité visuelle (`packages/brand`) |

## 11. Qualité et environnements

- Trois environnements : **local**, puis **préproduction** (données de démonstration), puis **production**.
- Chaque modification passe par le formatage, le contrôle des types, le lint et les tests. Le moteur tarifaire est entièrement couvert par des tests.
- Les migrations de base sont versionnées ; aucune modification manuelle en production.
- Les erreurs serveur sont journalisées, sans données personnelles inutiles.

## 12. Références

- Géocodage, Géoplateforme IGN (remplace l'ancienne API Adresse) : <https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage>
- Transfert de l'API Adresse à l'IGN : <https://adresse.data.gouv.fr/blog/lapi-adresse-de-la-base-adresse-nationale-est-transferee-a-lign>
- Calcul d'itinéraire, Géoplateforme IGN : <https://geoservices.ign.fr/services-geoplateforme-itineraire>
- Prix des carburants en France, flux instantané v2 : <https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/information>
- Dépannage sur autoroute (ASFA) : <https://www.autoroutes.fr/fr/depannage.htm>
