# 02 — Architecture technique

> Version 1.0 du 04/10/2026 : choix techniques appliqués (le cadrage initial datait du 03/10/2026).

## 1. Principes directeurs

1. **Séparation stricte** des responsabilités : interface publique, administration, moteur tarifaire, itinéraires, carburant, interventions, utilisateurs, statistiques, paramètres, notifications, base de données.
2. **Moteur tarifaire pur.** Il reçoit tout en entrée (choix du client, distances, prix du carburant, réglages) et rend un résultat détaillé, sans accès à la base de données ni au réseau. Il est donc testable, reproductible et réutilisable partout : site, simulateur, saisie téléphonique, future application chauffeur.
3. **Aucune valeur commerciale dans le code.** Chaque réglage vit en base, est versionné et se modifie dans l'admin.
4. **Le serveur est seul juge du prix.** Le navigateur envoie des choix, jamais un montant.
5. **Un adaptateur pour chaque service externe**, avec solution de repli. Aucune panne externe ne bloque l'appel ni l'envoi d'une demande.
6. **Montants en centimes entiers**, pourcentages en points de base (1 % = 100), heures dans le fuseau `Europe/Paris`.
7. **Tout est tracé** : qui a changé quoi et quand, et chaque estimation garde sa photographie.
8. **Mobile d'abord**, pour le public comme pour l'admin.

## 2. Technologies retenues

| Besoin | Choix appliqué | Raisons |
|---|---|---|
| Langage | TypeScript (mode strict) partout | un seul langage ; types partagés entre moteur, serveur et écrans |
| Site, admin, API | Next.js 16 (App Router), React 19 | pages publiques pré-générées et rafraîchies toutes les 5 minutes ; actions serveur pour l'admin et les calculs |
| Base de données | PostgreSQL (Neon, Supabase, Docker…) ; **PGlite** en local, sans rien installer | robuste et standard ; JSON pour les photographies |
| Accès base et migrations | Drizzle ORM, migrations SQL versionnées (`drizzle/`) | SQL typé ; migrations appliquées à chaque déploiement |
| Validation | Zod, schémas partagés client/serveur | une seule définition des règles de saisie |
| Authentification | sessions en base (jeton aléatoire dont seule l'empreinte SHA-256 est gardée), mot de passe haché avec **scrypt** (bibliothèque standard de Node.js), cookie `HttpOnly` `Secure` `SameSite=Lax`, tentatives limitées | primitives éprouvées, aucune dépendance supplémentaire |
| Interface | Tailwind CSS 4, composants accessibles faits pour le projet (interrupteurs, champs €, % et heure, fenêtres de confirmation) | design sur mesure, gros boutons |
| Animations | GSAP (ScrollTrigger, SplitText) et Lenis, uniquement sur le site public | motion design au défilement, désactivé si « moins d'animations » |
| Géocodage | Géoplateforme IGN (Base Adresse Nationale), secours Photon | gratuit, officiel |
| Itinéraires | Géoplateforme IGN, secours OSRM, OpenRouteService en option | gratuits ; fournisseurs interchangeables |
| Cartes | liens Google Maps et Waze pour la navigation ; carte OpenStreetMap pour vérifier la position du dépôt | aucun coût par affichage |
| Prix du carburant | jeu de données officiel « Prix des carburants en France — flux instantané v2 » (médiane autour du dépôt) | gratuit, officiel |
| Photos | **stockage privé dans la base**, nettoyées (EXIF et position GPS retirés), 8 par demande au plus | aucun service supplémentaire à configurer |
| Notifications | email (Resend) ; la demande reste toujours visible dans l'admin | gratuit au départ |
| Hébergement | Vercel + Neon recommandés ; image Docker pour un serveur à soi | HTTPS automatique, déploiement à chaque envoi sur GitHub |
| Tâches planifiées | tâche quotidienne Vercel (`/api/maintenance`), et à défaut lors des visites de l'admin | purges, carburant automatique |
| Tests | Vitest (moteur, réglages, photos, parcours serveur sur base en mémoire), Playwright (parcours complets sur mobile simulé) | — |
| Qualité | ESLint, contrôle des types, GitHub Actions | chaque modification est vérifiée automatiquement |

## 3. Structure du dépôt

Une seule application Next.js, organisée par couches :

```
rnb-auto/
├── src/
│   ├── app/
│   │   ├── (public)/             pages publiques et parcours de demande
│   │   ├── admin/                espace RNB AUTO (protégé)
│   │   └── api/                  adresses, photos, entretien
│   ├── core/                     logique pure, sans base ni réseau
│   │   ├── pricing/              moteur tarifaire (types, étapes, chaîne, ajustements)
│   │   ├── settings/             registre des réglages, validation, éditeur des tarifs
│   │   ├── calendar/             heure de Paris, jours fériés
│   │   ├── quotes/               schémas des demandes, vue client d'une estimation
│   │   └── interventions/        statuts et transitions autorisées
│   ├── server/                   cas d'usage et accès aux données
│   │   ├── db/                   schéma, connexion, données de départ
│   │   ├── geo/                  adresses et itinéraires (+ adaptateurs, coupe-circuit, cache)
│   │   ├── fuel/                 prix du carburant (+ adaptateur)
│   │   ├── quotes/               orchestration des estimations
│   │   ├── interventions/        demandes, statuts, ajustements, révisions, journal
│   │   ├── photos/               nettoyage et stockage des photos
│   │   ├── settings/ pricing-admin/  réglages, versions, journal, simulateur
│   │   ├── notifications/ auth/ security/ site/
│   │   └── maintenance.ts        entretien automatique
│   └── components/               interface (public, admin, identité visuelle)
├── drizzle/                      migrations SQL
├── scripts/                      migrations, données de départ, création d'un compte
├── tests/e2e/                    parcours Playwright
└── docs/
```

Les écrans appellent les services de `src/server` ; ils n'accèdent jamais directement à un fournisseur externe. Le moteur de `src/core/pricing` ne connaît ni la base ni le réseau.

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
| Photos | envoi, contrôle, stockage privé | base |
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
| Photos | stockage privé en base | bouton « Réessayer » sur chaque photo | demande déjà envoyée ; photos possibles sur WhatsApp |

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
- **Photos** : réduites et réencodées sur le téléphone ; côté serveur, format, taille et nombre contrôlés, métadonnées supprimées (dont la position GPS) ; stockage privé, visibles uniquement dans l'admin ; envoi par le client limité à quelques heures grâce à un jeton à usage restreint.
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
| Studio réseaux sociaux | projet séparé : modèles HTML/CSS/JS en 1080×1920 paramétrables (texte, prix, téléphone, ville), rendus image par image puis exportés en vidéo MP4, avec la même identité visuelle (`src/components/brand`) |

## 11. Qualité et environnements

- Environnements : **local** (base PGlite créée automatiquement), **prévisualisation** (chaque branche sur Vercel) et **production**.
- Chaque modification passe par le contrôle des types, le lint, les tests et la construction du site (GitHub Actions), puis par les parcours Playwright. Le moteur tarifaire est entièrement couvert par des tests.
- Les migrations de base sont versionnées ; aucune modification manuelle en production.
- Les erreurs serveur sont journalisées, sans données personnelles inutiles.

## 12. Références

- Géocodage, Géoplateforme IGN (remplace l'ancienne API Adresse) : <https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage>
- Transfert de l'API Adresse à l'IGN : <https://adresse.data.gouv.fr/blog/lapi-adresse-de-la-base-adresse-nationale-est-transferee-a-lign>
- Calcul d'itinéraire, Géoplateforme IGN : <https://geoservices.ign.fr/services-geoplateforme-itineraire>
- Prix des carburants en France, flux instantané v2 : <https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/information>
- Dépannage sur autoroute (ASFA) : <https://www.autoroutes.fr/fr/depannage.htm>
